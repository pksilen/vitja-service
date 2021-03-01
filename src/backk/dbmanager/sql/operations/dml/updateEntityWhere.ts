import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { RecursivePartial } from '../../../../types/RecursivePartial';
import createBackkErrorFromError from '../../../../errors/createBackkErrorFromError';
import { BackkEntity } from '../../../../types/entities/BackkEntity';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import { PreHook } from '../../../hooks/PreHook';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import getEntityWhere from '../dql/getEntityWhere';
import { PostHook } from '../../../hooks/PostHook';
import tryExecutePostHook from '../../../hooks/tryExecutePostHook';
import { PromiseOfErrorOr } from "../../../../types/PromiseOfErrorOr";
import isBackkError from "../../../../errors/isBackkError";

export default async function updateEntityWhere<T extends BackkEntity>(
  dbManager: AbstractSqlDbManager,
  fieldPathName: string,
  fieldValue: any,
  entity: RecursivePartial<T>,
  EntityClass: new () => T,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook<T>
): PromiseOfErrorOr<null> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    // eslint-disable-next-line prefer-const
    let [currentEntity, error] = await getEntityWhere(
      dbManager,
      fieldPathName,
      fieldValue,
      EntityClass,
      undefined,
      true
    );

    if (!currentEntity) {
      throw error;
    }

    await tryExecutePreHooks(preHooks ?? [], currentEntity);

     [, error] = await dbManager.updateEntity(
      { _id: currentEntity?._id ?? '', ...entity },
      EntityClass,
      []
    );

    if (postHook) {
      await tryExecutePostHook(postHook, null);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return [null, error];
  } catch (errorOrBackkError) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isBackkError(errorOrBackkError) ? errorOrBackkError : createBackkErrorFromError(errorOrBackkError);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
