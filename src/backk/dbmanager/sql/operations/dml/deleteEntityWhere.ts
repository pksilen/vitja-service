import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { EntityJoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
import tryStartLocalTransactionIfNeeded from "../transaction/tryStartLocalTransactionIfNeeded";
import tryCommitLocalTransactionIfNeeded from "../transaction/tryCommitLocalTransactionIfNeeded";
import tryRollbackLocalTransactionIfNeeded from "../transaction/tryRollbackLocalTransactionIfNeeded";
import cleanupLocalTransactionIfNeeded from "../transaction/cleanupLocalTransactionIfNeeded";
import { PostHook } from "../../../hooks/PostHook";
import tryExecutePostHook from "../../../hooks/tryExecutePostHook";
import { BackkEntity } from "../../../../types/entities/BackkEntity";
import { PromiseOfErrorOr } from "../../../../types/PromiseOfErrorOr";
import isBackkError from "../../../../errors/isBackkError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import { EntityPreHook } from "../../../hooks/EntityPreHook";
import tryExecuteEntityPreHooks from "../../../hooks/tryExecuteEntityPreHooks";
import getEntityWhere from "../dql/getEntityWhere";

export default async function deleteEntityWhere<T extends BackkEntity>(
  dbManager: AbstractSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  EntityClass: new () => T,
  preHooks?: EntityPreHook<T> | EntityPreHook<T>[],
  postHook?: PostHook<T>,
  postQueryOperations?: PostQueryOperations
): PromiseOfErrorOr<null> {
  if (fieldName.includes('.')) {
    throw new Error('fieldName parameter may not contain dots, i.e. it cannot be a field path name');
  }

  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    if (preHooks) {
      const [currentEntity, error] = await getEntityWhere(
        dbManager,
        fieldName,
        fieldValue,
        EntityClass,
        postQueryOperations,
        undefined,
        true
      );

      if (!currentEntity) {
        throw error;
      }

      await tryExecuteEntityPreHooks(preHooks, currentEntity);
    }

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          if (!joinSpec.isReadonly) {
            await dbManager.tryExecuteSql(
              `DELETE FROM ${dbManager.schema.toLowerCase()}.${joinSpec.subEntityTableName.toLowerCase()} WHERE ${joinSpec.subEntityForeignIdFieldName.toLowerCase()} IN (SELECT _id FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} WHERE ${fieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                1
              )})`,
              [fieldValue]
            );
          }
        }
      ),
      forEachAsyncParallel(
        entityContainer.manyToManyRelationTableSpecs,
        async ({ associationTableName, entityForeignIdFieldName }) => {
          if (associationTableName.startsWith(EntityClass.name + '_')) {
            await dbManager.tryExecuteSql(
              `DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} WHERE ${entityForeignIdFieldName.toLowerCase()} IN (SELECT _id FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} WHERE ${fieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
                1
              )})`
            );
          }
        }
      ),
      dbManager.tryExecuteSql(
        `DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()} WHERE ${fieldName.toLowerCase()} = ${dbManager.getValuePlaceholder(
          1
        )}`,
        [fieldValue]
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
