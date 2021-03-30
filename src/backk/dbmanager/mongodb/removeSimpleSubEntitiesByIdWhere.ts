import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';
import { EntityPreHook } from '../hooks/EntityPreHook';
import { PostHook } from '../hooks/PostHook';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import { PromiseOfErrorOr } from '../../types/PromiseOfErrorOr';
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

export default async function removeSimpleSubEntitiesByIdWhere<T extends BackkEntity, U extends SubEntity>(
  dbManager: MongoDbManager,
  fieldPathName: string,
  fieldValue: any,
  subEntityPath: string,
  subEntityId: string,
  EntityClass: new () => T,
  options?: {
    preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
    postHook?: PostHook<T>;
    postQueryOperations?: PostQueryOperations;
  }
): PromiseOfErrorOr<null> {
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
  let shouldUseTransaction = false;

  try {
    shouldUseTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    return await dbManager.tryExecute(shouldUseTransaction, async (client) => {
      if (options?.preHooks) {
        const [currentEntity, error] = await dbManager.getEntityWhere(
          fieldPathName,
          fieldValue,
          EntityClass,
          undefined,
          true
        );

        if (!currentEntity) {
          throw error;
        }

        await tryExecuteEntityPreHooks(options?.preHooks ?? [], currentEntity);
      }

      const isManyToMany = typePropertyAnnotationContainer.isTypePropertyManyToMany(
        EntityClass,
        subEntityPath
      );

      const pullCondition = isManyToMany
        ? { [subEntityPath]: new ObjectId(subEntityId) }
        : {
            [subEntityPath]: {
              $or: [{ _id: new ObjectId(subEntityId) }, { id: new ObjectId(subEntityId) }]
            }
          };

      await client
        .db(dbManager.dbName)
        .collection(EntityClass.name.toLowerCase())
        .updateOne(
          { matchExpression },
          {
            $pull: pullCondition
          }
        );

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
