import { BackkEntity } from '../../types/entities/BackkEntity';
import { EntityPreHook } from '../hooks/EntityPreHook';
import { PostHook } from '../hooks/PostHook';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import { PromiseErrorOr } from '../../types/PromiseErrorOr';
import tryExecuteEntityPreHooks from '../hooks/tryExecuteEntityPreHooks';
import MongoDbManager from '../MongoDbManager';
import tryStartLocalTransactionIfNeeded from '../sql/operations/transaction/tryStartLocalTransactionIfNeeded';
import tryExecutePostHook from '../hooks/tryExecutePostHook';
import isBackkError from '../../errors/isBackkError';
import createBackkErrorFromError from '../../errors/createBackkErrorFromError';
import cleanupLocalTransactionIfNeeded from '../sql/operations/transaction/cleanupLocalTransactionIfNeeded';
import { MongoClient, ObjectId } from "mongodb";
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';

export default async function removeFieldValues<T extends BackkEntity>(
  client: MongoClient,
  dbManager: MongoDbManager,
  _id: string,
  fieldName: string,
  fieldValues: (string | number | boolean)[],
  EntityClass: new () => T,
  options?: {
    preHooks?: EntityPreHook<T> | EntityPreHook<T>[];
    postHook?: PostHook<T>;
    postQueryOperations?: PostQueryOperations;
  }
): PromiseErrorOr<null> {
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

      await client
        .db(dbManager.dbName)
        .collection(EntityClass.name.toLowerCase())
        .updateOne(
          { _id: new ObjectId(_id) },
          { ...versionUpdate, ...lastModifiedTimestampUpdate, $pull: { [fieldName]: { $in: fieldValues } } }
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
  }
}
