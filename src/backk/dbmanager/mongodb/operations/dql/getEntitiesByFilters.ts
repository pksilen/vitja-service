import MongoDbQuery from '../../MongoDbQuery';
import UserDefinedFilter from '../../../../types/userdefinedfilters/UserDefinedFilter';
import SqlExpression from '../../../sql/expressions/SqlExpression';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import { PromiseOfErrorOr } from '../../../../types/PromiseOfErrorOr';
import startDbOperation from '../../../utils/startDbOperation';
import updateDbLocalTransactionCount from '../../../sql/operations/dql/utils/updateDbLocalTransactionCount';
import convertFilterObjectToMongoDbQueries from '../../convertFilterObjectToMongoDbQueries';
import getRootOperations from '../../getRootOperations';
import convertUserDefinedFiltersToMatchExpression from '../../convertUserDefinedFiltersToMatchExpression';
import convertMongoDbQueriesToMatchExpression from '../../convertMongoDbQueriesToMatchExpression';
import replaceIdStringsWithObjectIds from '../../replaceIdStringsWithObjectIds';
import { getNamespace } from 'cls-hooked';
import { ObjectId } from 'mongodb';
import getJoinPipelines from '../../getJoinPipelines';
import getTableName, { getEntityName } from '../../../utils/getTableName';
import getFieldOrdering from '../../getFieldOrdering';
import performPostQueryOperations from '../../performPostQueryOperations';
import tryFetchAndAssignSubEntitiesForManyToManyRelationships from '../../tryFetchAndAssignSubEntitiesForManyToManyRelationships';
import paginateSubEntities from '../../paginateSubEntities';
import removePrivateProperties from '../../removePrivateProperties';
import decryptEntities from '../../../../crypt/decryptEntities';
import isBackkError from '../../../../errors/isBackkError';
import createBackkErrorFromError from '../../../../errors/createBackkErrorFromError';
import recordDbOperationDuration from '../../../utils/recordDbOperationDuration';
import MongoDbManager from '../../../MongoDbManager';

export default async function getEntitiesByFilters<T>(
  dbManager: MongoDbManager,
  filters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression> | Partial<T> | object,
  EntityClass: new () => T,
  postQueryOperations: PostQueryOperations,
  isRecursive = false
): PromiseOfErrorOr<T[]> {
  const dbOperationStartTimeInMillis = startDbOperation(dbManager, 'getEntitiesByFilters');
  if (!isRecursive) {
    updateDbLocalTransactionCount(dbManager);
  }
  let matchExpression: any;
  let finalFilters: Array<MongoDbQuery<T> | UserDefinedFilter | SqlExpression>;

  if (typeof filters === 'object' && !Array.isArray(filters)) {
    finalFilters = convertFilterObjectToMongoDbQueries(filters);
  } else {
    finalFilters = filters;
  }

  if (Array.isArray(finalFilters) && finalFilters?.find((filter) => filter instanceof SqlExpression)) {
    throw new Error('SqlExpression is not supported for MongoDB');
  } else {
    const rootFilters = getRootOperations(finalFilters, EntityClass, dbManager.getTypes());
    const rootUserDefinedFilters = rootFilters.filter((filter) => !(filter instanceof MongoDbQuery));
    const rootMongoDbQueries = rootFilters.filter((filter) => filter instanceof MongoDbQuery);

    const userDefinedFiltersMatchExpression = convertUserDefinedFiltersToMatchExpression(
      rootUserDefinedFilters as UserDefinedFilter[]
    );

    const mongoDbQueriesMatchExpression = convertMongoDbQueriesToMatchExpression(
      rootMongoDbQueries as Array<MongoDbQuery<T>>
    );

    matchExpression = {
      ...userDefinedFiltersMatchExpression,
      ...mongoDbQueriesMatchExpression
    };
  }

  replaceIdStringsWithObjectIds(matchExpression);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  const Types = dbManager.getTypes();

  try {
    let isSelectForUpdate = false;

    if (
      getNamespace('multipleServiceFunctionExecutions')?.get('globalTransaction') ||
      dbManager.getClsNamespace()?.get('globalTransaction') ||
      dbManager.getClsNamespace()?.get('localTransaction')
    ) {
      isSelectForUpdate = true;
    }

    const entities = await dbManager.tryExecute(false, async (client) => {
      if (isSelectForUpdate) {
        await client
          .db(dbManager.dbName)
          .collection(EntityClass.name.toLowerCase())
          .updateMany(matchExpression, { $set: { _backkLock: new ObjectId() } });
      }

      const joinPipelines = getJoinPipelines(EntityClass, Types);
      const cursor = client
        .db(dbManager.dbName)
        .collection<T>(getTableName(EntityClass.name))
        .aggregate([...joinPipelines, getFieldOrdering((Types as any)[getEntityName(EntityClass.name)])])
        .match(matchExpression);

      performPostQueryOperations(cursor, postQueryOperations, EntityClass, Types);
      const rows = await cursor.toArray();

      await tryFetchAndAssignSubEntitiesForManyToManyRelationships(
        dbManager,
        rows,
        EntityClass,
        dbManager.getTypes(),
        finalFilters as Array<MongoDbQuery<T>>,
        postQueryOperations
      );

      paginateSubEntities(rows, postQueryOperations.paginations, EntityClass, dbManager.getTypes());
      removePrivateProperties(rows, EntityClass, dbManager.getTypes());
      decryptEntities(rows, EntityClass, dbManager.getTypes(), false);
      return rows;
    });

    return [entities, null];
  } catch (errorOrBackkError) {
    return isBackkError(errorOrBackkError)
      ? [null, errorOrBackkError]
      : [null, createBackkErrorFromError(errorOrBackkError)];
  } finally {
    recordDbOperationDuration(dbManager, dbOperationStartTimeInMillis);
  }
}
