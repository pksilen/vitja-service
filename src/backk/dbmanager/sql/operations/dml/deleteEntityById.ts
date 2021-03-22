import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { EntityJoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import getEntityById from "../dql/getEntityById";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
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
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";

export default async function deleteEntityById<T extends BackkEntity>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  EntityClass: new () => T,
  preHooks?: PreHook<T> | PreHook<T>[],
  postHook?: PostHook<T>,
  postQueryOperations?: PostQueryOperations,
  isRecursive = false
): PromiseOfErrorOr<null> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    if (preHooks) {
      const [currentEntity, error] = await getEntityById(
        dbManager,
        _id,
        EntityClass,
        postQueryOperations,
        undefined,
        true,
        true
      );

      if (!currentEntity) {
        throw error;
      }

      await tryExecutePreHooks(preHooks, currentEntity);
    }

    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw createErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS.INVALID_ARGUMENT,
        message: BACKK_ERRORS.INVALID_ARGUMENT.message + '_id: must be a numeric id'
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
            const sqlStatement = `DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
              1
            )}`;
            await dbManager.tryExecuteSql(sqlStatement, [numericId]);
          }
        }
      ),
      isRecursive ? Promise.resolve(undefined) : dbManager.tryExecuteSql(
        `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} WHERE ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()}._id = ${dbManager.getValuePlaceholder(
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
    return [
      null,
      isBackkError(errorOrBackkError) ? errorOrBackkError : createBackkErrorFromError(errorOrBackkError)
    ];
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
