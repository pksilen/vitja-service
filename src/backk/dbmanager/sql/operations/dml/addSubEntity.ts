import { JSONPath } from 'jsonpath-plus';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { Entity } from '../../../../types/Entity';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import isErrorResponse from '../../../../errors/isErrorResponse';

export default async function addSubEntity<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  newSubEntity: Omit<U, 'id'>,
  entityClass: new () => T,
  subEntityClass: new () => U,
  preHooks?: PreHook | PreHook[],
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  let didStartTransaction = false;

  try {
    if (
      !dbManager.getClsNamespace()?.get('localTransaction') &&
      !dbManager.getClsNamespace()?.get('globalTransaction')
    ) {
      await dbManager.tryBeginTransaction();
      didStartTransaction = true;
      dbManager.getClsNamespace()?.set('localTransaction', true);
      dbManager
        .getClsNamespace()
        ?.set('dbTransactionCount', dbManager.getClsNamespace()?.get('dbTransactionCount') + 1);
    }

    const currentEntityOrErrorResponse = await dbManager.getEntityById(_id, entityClass, postQueryOperations);
    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    const parentIdValue = JSONPath({ json: currentEntityOrErrorResponse, path: '$._id' })[0];
    const parentIdFieldName = entityAnnotationContainer.getAdditionIdPropertyName(subEntityClass.name);
    const maxSubItemId = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesPath }).reduce(
      (maxSubItemId: number, subItem: any) => {
        const subItemId = parseInt(subItem.id);
        return subItemId > maxSubItemId ? subItemId : maxSubItemId;
      },
      -1
    );

    const createdItemOrErrorResponse = await dbManager.createEntity(
      { ...newSubEntity, [parentIdFieldName]: parentIdValue, id: (maxSubItemId + 1).toString() } as any,
      subEntityClass,
      undefined,
      postQueryOperations,
      false
    );

    if ('errorMessage' in createdItemOrErrorResponse && isErrorResponse(createdItemOrErrorResponse)) {
      // noinspection ExceptionCaughtLocallyJS
      throw createdItemOrErrorResponse;
    }

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }

    return await dbManager.getEntityById(_id, entityClass, postQueryOperations);
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
