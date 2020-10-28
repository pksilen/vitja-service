import { JSONPath } from 'jsonpath-plus';
import { plainToClass } from 'class-transformer';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from './getEntityById';
import deleteEntityById from './deleteEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import getErrorResponse from '../../../../errors/getErrorResponse';
import executePreHooks from '../../../hooks/executePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import { Entity } from '../../../../types/Entity';

export default async function deleteSubEntities<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  entityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, undefined, true);
    if ('errorMessage' in itemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(itemOrErrorResponse.errorMessage);
    }

    if (preHooks) {
      await executePreHooks(preHooks, itemOrErrorResponse);
    }

    const entityInstance = plainToClass(entityClass, itemOrErrorResponse);
    const subEntities = JSONPath({ json: entityInstance, path: subEntitiesPath });
    await forEachAsyncParallel(subEntities, async (subItem: any) => {
      const possibleErrorResponse = await deleteEntityById(dbManager, subItem.id, subItem.constructor);
      if (possibleErrorResponse) {
        throw new Error(possibleErrorResponse.errorMessage);
      }
    });

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return getErrorResponse(error);
  }
}
