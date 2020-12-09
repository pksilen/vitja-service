import AbstractSqlDbManager from "../../../AbstractSqlDbManager";

export default async function tryRollbackLocalTransactionIfNeeded(isInTransaction: boolean, dbManager: AbstractSqlDbManager) {
  if (isInTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
    await dbManager.tryRollbackTransaction();
  }
}
