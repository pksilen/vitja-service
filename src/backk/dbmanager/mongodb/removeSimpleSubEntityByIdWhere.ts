import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';
import { EntityPreHook } from '../hooks/EntityPreHook';
import { PostHook } from '../hooks/PostHook';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import { PromiseErrorOr } from '../../types/PromiseErrorOr';
import tryExecuteEntityPreHooks from '../hooks/tryExecuteEntityPreHooks';
import MongoDbManager from '../MongoDbManager';
import startDbOperation from '../utils/startDbOperation';
import tryStartLocalTransactionIfNeeded from '../sql/operations/transaction/tryStartLocalTransactionIfNeeded';
import tryExecutePostHook from '../hooks/tryExecutePostHook';
import isBackkError from '../../errors/isBackkError';
import createBackkErrorFromError from '../../errors/createBackkErrorFromError';
import cleanupLocalTransactionIfNeeded from '../sql/operations/transaction/cleanupLocalTransactionIfNeeded';
import recordDbOperationDuration from '../utils/recordDbOperationDuration';
import { ObjectId } from 'mongodb';
import isUniqueField from '../sql/operations/dql/utils/isUniqueField';
import shouldUseRandomInitializationVector from '../../crypt/shouldUseRandomInitializationVector';
import shouldEncryptValue from '../../crypt/shouldEncryptValue';
import encrypt from '../../crypt/encrypt';
import MongoDbQuery from './MongoDbQuery';
import getRootOperations from './getRootOperations';
import convertMongoDbQueriesToMatchExpression from './convertMongoDbQueriesToMatchExpression';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import replaceIdStringsWithObjectIds from './replaceIdStringsWithObjectIds';
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';

export default async function removeSimpleSubEntityByIdWhere<T extends BackkEntity, U extends SubEntity>(
  dbManager: MongoDbManager,
  fieldPathName: string,
  fieldValue: any,
  subEntityPath: string,
  subEntityId: string,
  EntityClass: new () => T,
  options?: {
    entityPreHooks?: EntityPreHook<T> | EntityPreHook<T>[];
    postHook?: PostHook<T>;
    postQueryOperations?: PostQueryOperations;
  }
): PromiseErrorOr<null> {
  const dbOperationStartTimeInMillis = startDbOperation(dbManager, 'removeSubEntitiesByIdWhere');
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  if (!isUniqueField(fieldPathName, EntityClass, dbManager.getTypes())) {
    throw new Error(`Field ${fieldPathName} is not unique. Annotate entity field with @Unique annotation`);
  }

  let finalFieldValue = fieldValue;
  const lastDotPosition = fieldPathName.lastIndexOf('.');
  const fieldName = lastDotPosition === -1 ? fieldPathName : fieldPathName.slice(lastDotPosition + 1);
  if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
    finalFieldValue = encrypt(fieldValue, false);
  }

  const filters = [
    new MongoDbQuery(
      { [fieldName]: finalFieldValue },
      lastDotPosition === -1 ? '' : fieldPathName.slice(0, lastDotPosition)
    )
  ];

  const rootFilters = getRootOperations(filters as Array<MongoDbQuery<T>>, EntityClass, dbManager.getTypes());
  const matchExpression = convertMongoDbQueriesToMatchExpression(rootFilters);
  replaceIdStringsWithObjectIds(matchExpression);
  let shouldUseTransaction = false;

  try {
    shouldUseTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    return await dbManager.tryExecute(shouldUseTransaction, async (client) => {
      if (options?.entityPreHooks) {
        const [currentEntity, error] = await dbManager.getEntityByField(
          EntityClass,
          fieldPathName,
          fieldValue,
          undefined,
          true
        );

        if (!currentEntity) {
          throw error;
        }

        await tryExecuteEntityPreHooks(options?.entityPreHooks ?? [], currentEntity);
      }

      const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
      let versionUpdate = {};
      if (entityPropertyNameToPropertyTypeNameMap.version) {
        // noinspection ReuseOfLocalVariableJS
        versionUpdate = { $inc: { version: 1 } };
      }

      let lastModifiedTimestampUpdate = {};
      if (entityPropertyNameToPropertyTypeNameMap.lastModifiedTimestamp) {
        lastModifiedTimestampUpdate = { $set: { lastModifiedTimestamp: new Date() } };
      }

      const isManyToMany = typePropertyAnnotationContainer.isTypePropertyManyToMany(
        EntityClass,
        subEntityPath
      );

      const isMongoIdString = isNaN(parseInt(subEntityId, 10)) && subEntityId.length === 24;
      const pullCondition = isManyToMany
        ? { [subEntityPath]: subEntityId }
        : {
            [subEntityPath]: {
              [`${isMongoIdString ? '_id' : 'id'}`]: isMongoIdString ? new ObjectId(subEntityId) : subEntityId
            }
          };

      await client
        .db(dbManager.dbName)
        .collection(EntityClass.name.toLowerCase())
        .updateOne(matchExpression, { ...versionUpdate, ...lastModifiedTimestampUpdate, $pull: pullCondition });

      if (options?.postHook) {
        await tryExecutePostHook(options.postHook, null);
      }

      return [null, null];
    });
  } catch (errorOrBackkError) {
    return isBackkError(errorOrBackkError)
      ? [null, errorOrBackkError]
      : [null, createBackkErrorFromError(errorOrBackkError)];
  } finally {
    cleanupLocalTransactionIfNeeded(shouldUseTransaction, dbManager);
    recordDbOperationDuration(dbManager, dbOperationStartTimeInMillis);
  }
}
