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

export default async function removeSubEntities<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  const Types = dbManager.getTypes();
  let didStartTransaction = false;

  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction') &&
      !dbManager.getClsNamespace()?.get('localTransaction')) {
      await dbManager.beginTransaction();
      didStartTransaction = true;
      dbManager.getClsNamespace()?.set('localTransaction', true);
    }

    const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
    if ('errorMessage' in itemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(itemOrErrorResponse.errorMessage);
    }

    if (preHooks) {
      await tryExecutePreHooks(preHooks, itemOrErrorResponse);
    }

    const entityInstance = plainToClass(entityClass, itemOrErrorResponse);
    const subEntities = JSONPath({ json: entityInstance, path: subEntitiesPath });
    await forEachAsyncParallel(subEntities, async (subItem: any) => {
      const possibleErrorResponse = await deleteEntityById(dbManager, subItem.id, subItem.constructor);
      if (possibleErrorResponse) {
        throw new Error(possibleErrorResponse.errorMessage);
      }
    });

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }
  } catch (error) {
    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return createErrorResponseFromError(error);
  } finally {
    if (didStartTransaction) {
      dbManager.getClsNamespace()?.set('localTransaction', false);
    }
  }
}
