import { JSONPath } from 'jsonpath-plus';
import { plainToClass } from 'class-transformer';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
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
import tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded from './utils/tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import findParentEntityAndPropertyNameForSubEntity from '../../../../metadata/findParentEntityAndPropertyNameForSubEntity';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import { PostHook } from '../../../hooks/PostHook';
import tryExecutePostHook from '../../../hooks/tryExecutePostHook';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';

export default async function removeSubEntities<T extends Entity, U extends object>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  subEntitiesJsonPath: string,
  EntityClass: new () => T,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);
    const currentEntityOrErrorResponse = await getEntityById(dbManager, _id, EntityClass, undefined, true);
    await tryExecutePreHooks(preHooks ?? [], currentEntityOrErrorResponse);

    await tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded(
      dbManager,
      currentEntityOrErrorResponse,
      EntityClass
    );

    const currentEntityInstance = plainToClass(EntityClass, currentEntityOrErrorResponse);
    const subEntities = JSONPath({ json: currentEntityInstance, path: subEntitiesJsonPath });

    await forEachAsyncParallel(subEntities, async (subEntity: any) => {
      const parentEntityClassAndPropertyNameForSubEntity = findParentEntityAndPropertyNameForSubEntity(
        EntityClass,
        subEntity.constructor,
        dbManager.getTypes()
      );

      if (
        parentEntityClassAndPropertyNameForSubEntity &&
        typePropertyAnnotationContainer.isTypePropertyManyToMany(
          parentEntityClassAndPropertyNameForSubEntity[0],
          parentEntityClassAndPropertyNameForSubEntity[1]
        )
      ) {
        const associationTableName = `${EntityClass.name}_${subEntity.constructor.name}`;

        const {
          entityForeignIdFieldName,
          subEntityForeignIdFieldName
        } = entityAnnotationContainer.getManyToManyRelationTableSpec(associationTableName);

        const numericId = parseInt(_id, 10);

        await dbManager.tryExecuteSql(
          `DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
            1
          )} AND ${subEntityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(2)}`,
          [numericId, subEntity._id]
        );
      } else {
        const possibleErrorResponse = await deleteEntityById(dbManager, subEntity.id, subEntity.constructor);

        if (possibleErrorResponse) {
          throw possibleErrorResponse;
        }
      }
    });

    const response = await dbManager.getEntityById(_id, EntityClass, postQueryOperations);

    if (postHook) {
      await tryExecutePostHook(postHook);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return response;
  } catch (errorOrErrorResponse) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isErrorResponse(errorOrErrorResponse)
      ? errorOrErrorResponse
      : createErrorResponseFromError(errorOrErrorResponse);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
