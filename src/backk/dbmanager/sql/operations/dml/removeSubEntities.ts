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
import { Entity } from '../../../../types/Entity';
import isErrorResponse from '../../../../errors/isErrorResponse';

export default async function removeSubEntities<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  let didStartTransaction = false;

  try {
    if (
      !dbManager.getClsNamespace()?.get('globalTransaction') &&
      !dbManager.getClsNamespace()?.get('localTransaction')
    ) {
      await dbManager.tryBeginTransaction();
      didStartTransaction = true;
      dbManager.getClsNamespace()?.set('localTransaction', true);
      dbManager
        .getClsNamespace()
        ?.set('dbTransactionCount', dbManager.getClsNamespace()?.get('dbTransactionCount') + 1);
    }

    const currentEntityOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    const currentEntityInstance = plainToClass(entityClass, currentEntityOrErrorResponse);
    const subEntities = JSONPath({ json: currentEntityInstance, path: subEntitiesPath });
    await forEachAsyncParallel(subEntities, async (subItem: any) => {
      const possibleErrorResponse = await deleteEntityById(dbManager, subItem.id, subItem.constructor);
      if (possibleErrorResponse) {
        throw possibleErrorResponse;
      }
    });

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }
  } catch (errorOrErrorResponse) {
    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryRollbackTransaction();
    }
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    if (didStartTransaction) {
      dbManager.getClsNamespace()?.set('localTransaction', false);
    }
  }
}
