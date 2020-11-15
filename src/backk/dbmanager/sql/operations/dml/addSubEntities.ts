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
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';

export default async function addSubEntities<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  newSubEntities: Array<Omit<U, 'id'>>,
  entityClass: new () => T,
  subEntityClass: new () => U,
  preHooks?: PreHook | PreHook[],
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
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

    await forEachAsyncParallel(newSubEntities, async (newSubEntity, index) => {
      const createdItemOrErrorResponse = await dbManager.createEntity(
        {
          ...newSubEntity,
          [parentIdFieldName]: parentIdValue,
          id: (maxSubItemId + 1 + index).toString()
        } as any,
        subEntityClass,
        undefined,
        postQueryOperations,
        false
      );

      if ('errorMessage' in createdItemOrErrorResponse && isErrorResponse(createdItemOrErrorResponse)) {
        // noinspection ExceptionCaughtLocallyJS
        throw createdItemOrErrorResponse;
      }
    });

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return await dbManager.getEntityById(_id, entityClass, postQueryOperations);
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
