import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import entityContainer, { EntityJoinSpec } from '../../../../decorators/entity/entityAnnotationContainer';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import tryStartLocalTransactionIfNeeded from '../transaction/tryStartLocalTransactionIfNeeded';
import tryCommitLocalTransactionIfNeeded from '../transaction/tryCommitLocalTransactionIfNeeded';
import tryRollbackLocalTransactionIfNeeded from '../transaction/tryRollbackLocalTransactionIfNeeded';
import cleanupLocalTransactionIfNeeded from '../transaction/cleanupLocalTransactionIfNeeded';

export default async function deleteAllEntities<T>(
  dbManager: AbstractSqlDbManager,
  EntityClass: new () => T
): Promise<void | ErrorResponse> {
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);
  let didStartTransaction = false;

  try {
    didStartTransaction = await tryStartLocalTransactionIfNeeded(dbManager);

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[EntityClass.name] || {}),
        async (joinSpec: EntityJoinSpec) => {
          await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema.toLowerCase()}.${joinSpec.subEntityTableName.toLowerCase()}`);
        }
      ),
      forEachAsyncParallel(entityContainer.manyToManyRelationTableSpecs, async ({ associationTableName }) => {
        if (associationTableName.startsWith(EntityClass.name)) {
          await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()}`);
        }
      }),
      dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()}`)
    ]);

    await tryCommitLocalTransactionIfNeeded(didStartTransaction, dbManager);
  } catch (error) {
    await tryRollbackLocalTransactionIfNeeded(didStartTransaction, dbManager);
    return createErrorResponseFromError(error);
  } finally {
    cleanupLocalTransactionIfNeeded(didStartTransaction, dbManager);
  }
}
