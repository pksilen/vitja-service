import SqlExpression from '../../expressions/SqlExpression';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import transformRowsToObjects from './transformresults/transformRowsToObjects';
import createBackkErrorFromError from '../../../../errors/createBackkErrorFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import getSqlSelectStatementParts from './utils/getSqlSelectStatementParts';
import updateDbLocalTransactionCount from './utils/updateDbLocalTransactionCount';
import UserDefinedFilter from '../../../../types/userdefinedfilters/UserDefinedFilter';
import MongoDbQuery from '../../../mongodb/MongoDbQuery';
import convertFilterObjectToSqlEquals from './utils/convertFilterObjectToSqlEquals';
import getTableName from '../../../utils/getTableName';
import { PromiseErrorOr } from '../../../../types/PromiseErrorOr';
import { getNamespace } from 'cls-hooked';
import { PreHook } from '../../../hooks/PreHook';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import DefaultPostQueryOperations from '../../../../types/postqueryoperations/DefaultPostQueryOperations';

export default async function getEntitiesByFilters<T>(
  dbManager: AbstractSqlDbManager,
  filters: Array<MongoDbQuery<T> | SqlExpression | UserDefinedFilter> | object,
  EntityClass: new () => T,
  options?: {
    preHooks?: PreHook | PreHook[];
    postQueryOperations?: PostQueryOperations;
  }
): PromiseErrorOr<T[]> {
  if (typeof filters === 'object' && !Array.isArray(filters)) {
    // noinspection AssignmentToFunctionParameterJS
    filters = convertFilterObjectToSqlEquals(filters);
  } else if (filters.find((filter) => filter instanceof MongoDbQuery)) {
    throw new Error('filters must be an array of SqlExpressions and/or UserDefinedFilters');
  }

  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    if (options?.preHooks) {
      didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    }

    await tryExecutePreHooks(options?.preHooks ?? []);
    updateDbLocalTransactionCount(dbManager);
    let isSelectForUpdate = false;

    if (
      getNamespace('multipleServiceFunctionExecutions')?.get('globalTransaction') ||
      dbManager.getClsNamespace()?.get('globalTransaction') ||
      dbManager.getClsNamespace()?.get('localTransaction')
    ) {
      isSelectForUpdate = true;
    }

    const {
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      columns,
      joinClauses,
      filterValues,
      outerSortClause
    } = getSqlSelectStatementParts(
      dbManager,
      options?.postQueryOperations ?? new DefaultPostQueryOperations(),
      EntityClass,
      filters as any
    );

    const tableName = getTableName(EntityClass.name);
    const tableAlias = dbManager.schema + '_' + EntityClass.name.toLowerCase();

    const selectStatement = [
      `SELECT ${columns} FROM (SELECT * FROM ${dbManager.schema}.${tableName}`,
      rootWhereClause,
      rootSortClause,
      rootPaginationClause,
      `) AS ${tableAlias}`,
      joinClauses,
      outerSortClause,
      isSelectForUpdate ? dbManager.getUpdateForClause(tableAlias) : undefined
    ]
      .filter((sqlPart) => sqlPart)
      .join(' ');

    const result = await dbManager.tryExecuteQueryWithNamedParameters(selectStatement, filterValues);

    const entities = transformRowsToObjects(
      dbManager.getResultRows(result),
      EntityClass,
      options?.postQueryOperations ?? new DefaultPostQueryOperations(),
      dbManager
    );

    return [entities, null];
  } catch (error) {
    return [null, createBackkErrorFromError(error)];
  }
}
