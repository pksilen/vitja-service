import { JSONPath } from 'jsonpath-plus';
import { plainToClass } from 'class-transformer';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from '../dql/getEntityById';
import deleteEntityById from './deleteEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { Entity } from '../../../../types/entities/Entity';
import isErrorResponse from '../../../../errors/isErrorResponse';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import tryUpdateEntityVersionIfNeeded from './utils/tryUpdateEntityVersionIfNeeded';
import tryUpdateEntityLastModifiedTimestampIfNeeded from './utils/tryUpdateEntityLastModifiedTimestampIfNeeded';

export default async function removeSubEntities<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  EntityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass.name);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    const currentEntityOrErrorResponse = await getEntityById(dbManager, _id, EntityClass, undefined, true);
    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    await tryUpdateEntityVersionIfNeeded(dbManager, currentEntityOrErrorResponse, EntityClass);
    await tryUpdateEntityLastModifiedTimestampIfNeeded(dbManager, currentEntityOrErrorResponse, EntityClass);
    const currentEntityInstance = plainToClass(EntityClass, currentEntityOrErrorResponse);
    const subEntities = JSONPath({ json: currentEntityInstance, path: subEntitiesPath });

    await forEachAsyncParallel(subEntities, async (subEntity: any) => {
      const possibleErrorResponse = await deleteEntityById(dbManager, subEntity.id, subEntity.constructor);
      if (possibleErrorResponse) {
        throw possibleErrorResponse;
      }
    });

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
