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
import tryUpdateEntityLastModifiedTimestampIfNeeded from './utils/tryUpdateEntityLastModifiedTimestampIfNeeded';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import { SubEntity } from "../../../../types/entities/SubEntity";

export default async function addSubEntities<T extends Entity, U extends SubEntity>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  newSubEntities: Array<Omit<U, 'id'>>,
  EntityClass: new () => T,
  SubEntityClass: new () => U,
  preHooks?: PreHook | PreHook[],
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  // noinspection AssignmentToFunctionParameterJS
  SubEntityClass = dbManager.getType(SubEntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    const currentEntityOrErrorResponse = await dbManager.getEntityById(_id, EntityClass, postQueryOperations);
    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);
    await tryUpdateEntityVersionIfNeeded(dbManager, currentEntityOrErrorResponse, EntityClass);
    await tryUpdateEntityLastModifiedTimestampIfNeeded(dbManager, currentEntityOrErrorResponse, EntityClass);
    const maxSubItemId = JSONPath({ json: currentEntityOrErrorResponse, path: subEntitiesPath }).reduce(
      (maxSubItemId: number, subItem: any) => {
        const subItemId = parseInt(subItem.id);
        return subItemId > maxSubItemId ? subItemId : maxSubItemId;
      },
      -1
    );

    const parentEntityClassAndPropertyNameForSubEntity = findParentEntityAndPropertyNameForSubEntity(
      EntityClass,
      SubEntityClass,
      dbManager.getTypes()
    );

    if (parentEntityClassAndPropertyNameForSubEntity) {
      const metadataForValidations = getFromContainer(MetadataStorage).getTargetValidationMetadatas(
        parentEntityClassAndPropertyNameForSubEntity[0],
        ''
      );

      const foundArrayMaxSizeValidation = metadataForValidations.find(
        (validationMetadata: ValidationMetadata) =>
          validationMetadata.propertyName === parentEntityClassAndPropertyNameForSubEntity[1] &&
          validationMetadata.type === 'arrayMaxSize'
      );

      if (
        foundArrayMaxSizeValidation &&
        maxSubItemId + newSubEntities.length >= foundArrayMaxSizeValidation.constraints[0]
      ) {
        // noinspection ExceptionCaughtLocallyJS
        throw createErrorResponseFromErrorMessageAndStatusCode(
          parentEntityClassAndPropertyNameForSubEntity[0].name +
            '.' +
            parentEntityClassAndPropertyNameForSubEntity[1] +
            ': Cannot add new entity. Maximum allowed entities limit reached',
          HttpStatusCodes.BAD_REQUEST
        );
      }
    }

    const foreignIdFieldName = entityAnnotationContainer.getForeignIdFieldName(SubEntityClass.name);
    await forEachAsyncParallel(newSubEntities, async (newSubEntity, index) => {
      if (
        parentEntityClassAndPropertyNameForSubEntity &&
        typePropertyAnnotationContainer.isTypePropertyManyToMany(
          parentEntityClassAndPropertyNameForSubEntity[0],
          parentEntityClassAndPropertyNameForSubEntity[1]
        )
      ) {
        let subEntityOrErrorResponse = await dbManager.getEntityById(newSubEntity._id ?? '', SubEntityClass);
        if ('errorMessage' in subEntityOrErrorResponse) {
          subEntityOrErrorResponse = await dbManager.createEntity(
            newSubEntity as any,
            SubEntityClass,
            undefined,
            undefined,
            false
          );
          if ('errorMessage' in subEntityOrErrorResponse) {
            // noinspection ExceptionCaughtLocallyJS
            throw subEntityOrErrorResponse;
          }
        }

        const associationTable = `${EntityClass.name}_${SubEntityClass}`;
        const {
          entityForeignIdFieldName,
          subEntityForeignIdFieldName
        } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTable);
        dbManager.tryExecuteSql(
          `INSERT INTO ${dbManager.schema}.${associationTable} (${entityForeignIdFieldName}, ${subEntityForeignIdFieldName}) VALUES ($1, $2)`,
          [(currentEntityOrErrorResponse as any)._id, subEntityOrErrorResponse._id]
        );
      } else {
        const subEntityOrErrorResponse = await dbManager.createEntity(
          {
            ...newSubEntity,
            [foreignIdFieldName]: (currentEntityOrErrorResponse as any)._id,
            id: (maxSubItemId + 1 + index).toString()
          } as any,
          SubEntityClass,
          undefined,
          undefined,
          false
        );

        if ('errorMessage' in subEntityOrErrorResponse && isErrorResponse(subEntityOrErrorResponse)) {
          // noinspection ExceptionCaughtLocallyJS
          throw subEntityOrErrorResponse;
        }
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
