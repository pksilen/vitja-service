import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import entityContainer, { JoinSpec } from '../../../../decorators/entity/entityAnnotationContainer';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';

export default async function deleteAllEntities<T>(
  dbManager: PostgreSqlDbManager,
  entityClass: new () => T
): Promise<void | ErrorResponse> {
  let didStartTransaction = false;

  try {
    if (
      !dbManager.getClsNamespace()?.get('globalTransaction') &&
      !dbManager.getClsNamespace()?.get('localTransaction')
    ) {
      await dbManager.tryBeginTransaction();
      didStartTransaction = true;
      dbManager.getClsNamespace()?.set('localTransaction', true);
    }

    await Promise.all([
      forEachAsyncParallel(
        Object.values(entityContainer.entityNameToJoinsMap[entityClass.name] || {}),
        async (joinSpec: JoinSpec) => {
          await dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${joinSpec.joinTableName}`);
        }
      ),
      dbManager.tryExecuteSql(`DELETE FROM ${dbManager.schema}.${entityClass.name}`)
    ]);

    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryCommitTransaction();
    }
  } catch (error) {
    if (didStartTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.tryRollbackTransaction();
    }
    return createErrorResponseFromError(error);
  } finally {
    if (didStartTransaction) {
      dbManager.getClsNamespace()?.set('localTransaction', false);
    }
  }
}
