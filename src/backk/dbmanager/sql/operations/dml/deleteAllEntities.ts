import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import entityContainer, { EntityJoinSpec } from "../../../../decorators/entity/entityAnnotationContainer";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
import tryStartLocalTransactionIfNeeded from "../transaction/tryStartLocalTransactionIfNeeded";
import tryCommitLocalTransactionIfNeeded from "../transaction/tryCommitLocalTransactionIfNeeded";
import tryRollbackLocalTransactionIfNeeded from "../transaction/tryRollbackLocalTransactionIfNeeded";
import cleanupLocalTransactionIfNeeded from "../transaction/cleanupLocalTransactionIfNeeded";
import { PromiseOfErrorOr } from "../../../../types/PromiseOfErrorOr";

export default async function deleteAllEntities<T>(
  dbManager: AbstractSqlDbManager,
  EntityClass: new () => T
): PromiseOfErrorOr<null> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          if (!joinSpec.isReadonly) {
            await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema.toLowerCase()}.${joinSpec.subEntityTableName.toLowerCase()}`);
          }
        }
      ),
      forEachAsyncParallel(entityContainer.manyToManyRelationTableSpecs, async ({ associationTableName }) => {
        if (associationTableName.startsWith(EntityClass.name + '_')) {
          await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()}`);
        }
      }),
      dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()}`)
    ]);

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return [null, null];
  } catch (error) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return [null, createBackkErrorFromError(error)];
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
