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
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';

export default async function removeSimpleSubEntitiesById<T extends BackkEntity, U extends SubEntity>(
  dbManager: MongoDbManager,
  _id: string,
  subEntityPath: string,
  subEntityId: string,
  EntityClass: new () => T,
  options?: {
    preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
    postHook?: PostHook<T>;
    postQueryOperations?: PostQueryOperations;
  }
): PromiseOfErrorOr<null> {
  const dbOperationStartTimeInMillis = startDbOperation(dbManager, 'removeSubEntities');
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let shouldUseTransaction = false;

  try {
    shouldUseTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    return await dbManager.tryExecute(shouldUseTransaction, async (client) => {
      if (options?.preHooks) {
        const [currentEntity, error] = await dbManager.getEntityById(_id, EntityClass, undefined, true, true);
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
        ? { [subEntityPath]: subEntityId }
        : {
            [subEntityPath]: {
              $or: [{ _id: new ObjectId(subEntityId) }, { id: new ObjectId(subEntityId) }]
            }
          };

      await client
        .db(dbManager.dbName)
        .collection(EntityClass.name.toLowerCase())
        .updateOne(
          { _id: new ObjectId(_id) },
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
