import { JSONPath } from 'jsonpath-plus';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { Entity } from '../../../../types/entities/Entity';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import isErrorResponse from '../../../../errors/isErrorResponse';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import findParentEntityAndPropertyNameForSubEntity from '../../../../metadata/findParentEntityAndPropertyNameForSubEntity';
import { getFromContainer, MetadataStorage } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import createErrorResponseFromErrorMessageAndStatusCode from '../../../../errors/createErrorResponseFromErrorMessageAndStatusCode';
import { HttpStatusCodes } from '../../../../constants/constants';
import tryUpdateEntityVersionIfNeeded from './utils/tryUpdateEntityVersionIfNeeded';
import tryUpdateEntityLastModifiedTimestampIfNeeded
  from "./utils/tryUpdateEntityLastModifiedTimestampIfNeeded";

export default async function addSubEntities<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  newSubEntities: Array<Omit<U, 'id'>>,
  EntityClass: new () => T,
  SubEntityClass: new () => U,
  preHooks?: PreHook | PreHook[],
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    const currentEntityOrErrorResponse = await dbManager.getEntityById(_id, EntityClass, postQueryOperations);
    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    await tryUpdateEntityVersionIfNeeded(dbManager, currentEntityOrErrorResponse, EntityClass);
    await tryUpdateEntityLastModifiedTimestampIfNeeded(dbManager, currentEntityOrErrorResponse, EntityClass);
    const parentIdValue = JSONPath({ json: currentEntityOrErrorResponse, path: '$._id' })[0];
    const parentIdFieldName = entityAnnotationContainer.getAdditionIdPropertyName(SubEntityClass.name);
    const maxSubItemId = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesPath }).reduce(
      (maxSubItemId: number, subItem: any) => {
        const subItemId = parseInt(subItem.id);
        return subItemId > maxSubItemId ? subItemId : maxSubItemId;
      },
      -1
    );

    const parentEntityAndPropertyName = findParentEntityAndPropertyNameForSubEntity(
      EntityClass,
      SubEntityClass,
      dbManager.getTypes()
    );

    if (parentEntityAndPropertyName) {
      const metadataForValidations = getFromContainer(MetadataStorage).getTargetValidationMetadatas(
        parentEntityAndPropertyName[0],
        ''
      );

      const foundArrayMaxSizeValidation = metadataForValidations.find(
        (validationMetadata: ValidationMetadata) =>
          validationMetadata.propertyName === parentEntityAndPropertyName[1] &&
          validationMetadata.type === 'arrayMaxSize'
      );

      if (
        foundArrayMaxSizeValidation &&
        maxSubItemId + newSubEntities.length >= foundArrayMaxSizeValidation.constraints[0]
      ) {
        // noinspection ExceptionCaughtLocallyJS
        throw createErrorResponseFromErrorMessageAndStatusCode(
          parentEntityAndPropertyName[0].name +
            '.' +
            parentEntityAndPropertyName[1] +
            ': Cannot add new entity. Maximum allowed entities limit reached',
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    await forEachAsyncParallel(newSubEntities, async (newSubEntity, index) => {
      const createdItemOrErrorResponse = await dbManager.createEntity(
        {
          ...newSubEntity,
          [parentIdFieldName]: parentIdValue,
          id: (maxSubItemId + 1 + index).toString()
        } as any,
        SubEntityClass,
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
    return await dbManager.getEntityById(_id, EntityClass, postQueryOperations);
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
