import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import entityContainer, { EntityJoinSpec } from '../../../../decorators/entity/entityAnnotationContainer';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import getEntityById from '../dql/getEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import tryExecutePreHooks from '../../../hooks/tryExecutePreHooks';
import { PreHook } from '../../../hooks/PreHook';
import createErrorMessageWithStatusCode from '../../../../errors/createErrorMessageWithStatusCode';
import isErrorResponse from '../../../../errors/isErrorResponse';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';
import { HttpStatusCodes } from '../../../../constants/constants';

export default async function deleteEntityById<T extends object>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  EntityClass: new () => T,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    if (preHooks) {
      const itemOrErrorResponse = await getEntityById(dbManager, _id, EntityClass, undefined, true);
      await tryExecutePreHooks(preHooks, itemOrErrorResponse);
    }

    const typeMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(
        createErrorMessageWithStatusCode(idFieldName + ': must be a numeric id', HttpStatusCodes.BAD_REQUEST)
      );
    }

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          await dbManager.tryExecuteSql(
            `DELETE FROM ${dbManager.schema.toLowerCase()}.${joinSpec.subEntityTableName.toLowerCase()} WHERE ${
              joinSpec.subEntityForeignIdFieldName.toLowerCase()
            } = ${dbManager.getValuePlaceholder(1)}`,
            [numericId]
          );
        }
      ),
      forEachAsyncParallel(
        entityContainer.manyToManyRelationTableSpecs,
        async ({ associationTableName, entityForeignIdFieldName }) => {
          if (associationTableName.startsWith(EntityClass.name)) {
            await dbManager.tryExecuteSql(
              `DELETE FROM ${
                dbManager.schema.toLowerCase()
              }.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                1
              )}`,
              [numericId]
            );
          }
        }
      ),
      dbManager.tryExecuteSql(
        `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} WHERE ${dbManager.schema.toLowerCase()}.${
          EntityClass.name.toLowerCase()
        }.${idFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(1)}`,
        [numericId]
      )
    ]);

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
