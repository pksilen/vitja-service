import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { EntityJoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import getEntityById from "../dql/getEntityById";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
import getClassPropertyNameToPropertyTypeNameMap
  from "../../../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import tryExecutePreHooks from "../../../hooks/tryExecutePreHooks";
import { PreHook } from "../../../hooks/PreHook";
import tryStartLocalTransactionIfNeeded from "../transaction/tryStartLocalTransactionIfNeeded";
import tryCommitLocalTransactionIfNeeded from "../transaction/tryCommitLocalTransactionIfNeeded";
import tryRollbackLocalTransactionIfNeeded from "../transaction/tryRollbackLocalTransactionIfNeeded";
import cleanupLocalTransactionIfNeeded from "../transaction/cleanupLocalTransactionIfNeeded";
import { PostHook } from "../../../hooks/PostHook";
import tryExecutePostHook from "../../../hooks/tryExecutePostHook";
import createErrorFromErrorCodeMessageAndStatus
  from "../../../../errors/createErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../../../../errors/backkErrors";
import { BackkEntity } from "../../../../types/entities/BackkEntity";
import { PromiseOfErrorOr } from "../../../../types/PromiseOfErrorOr";
import isBackkError from "../../../../errors/isBackkError";

export default async function deleteEntityById<T extends BackkEntity>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  EntityClass: new () => T,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook<T>
): PromiseOfErrorOr<null> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    if (preHooks) {
      const [currentEntity, error] = await getEntityById(dbManager, _id, EntityClass, undefined, true, true);
      if (!currentEntity) {
        throw error;
      }

      await tryExecutePreHooks(preHooks, currentEntity);
    }

    const typeMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw createErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.INVALID_ARGUMENT,
        errorMessage: BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + idFieldName + ': must be a numeric id'
      });
    }

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          if (!joinSpec.isReadonly) {
            await dbManager.tryExecuteSql(
              `DELETE FROM ${dbManager.schema.toLowerCase()}.${joinSpec.subEntityTableName.toLowerCase()} WHERE ${joinSpec.subEntityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                1
              )}`,
              [numericId]
            );
          }
        }
      ),
      forEachAsyncParallel(
        entityContainer.manyToManyRelationTableSpecs,
        async ({ associationTableName, entityForeignIdFieldName }) => {
          if (associationTableName.startsWith(EntityClass.name + '_')) {
            await dbManager.tryExecuteSql(
              `DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                1
              )}`,
              [numericId]
            );
          }
        }
      ),
      dbManager.tryExecuteSql(
        `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} WHERE ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()}.${idFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
          1
        )}`,
        [numericId]
      )
    ]);

    if (postHook) {
      await tryExecutePostHook(postHook, null);
    }

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return [null, null];
  } catch (errorOrBackkError) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return isBackkError(errorOrBackkError) ? errorOrBackkError : createBackkErrorFromError(errorOrBackkError);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
