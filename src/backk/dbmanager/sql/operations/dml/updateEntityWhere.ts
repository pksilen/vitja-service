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

export default async function updateEntityWhere<T extends BackkEntity>(
  dbManager: AbstractSqlDbManager,
  fieldPathName: string,
  fieldValue: any,
  entity: RecursivePartial<T>,
  EntityClass: new () => T,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook
): PromiseOfErrorOr<null> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    const currentEntityOrErrorResponse = await getEntityWhere(
      dbManager,
      fieldPathName,
      fieldValue,
      EntityClass
    );

    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);

    const possibleErrorResponse = await dbManager.updateEntity(
      { _id: (currentEntityOrErrorResponse as T)._id, ...entity },
      EntityClass,
      []
    );

    if (postHook) {
      await tryExecutePostHook(postHook);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return possibleErrorResponse;
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createBackkErrorFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
