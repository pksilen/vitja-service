import PostgreSqlDbManager from "../../../PostgreSqlDbManager";

export default async function tryRollbackLocalTransactionIfNeeded(isInTransaction: boolean, dbManager: PostgreSqlDbManager) {
  if (isInTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
    await dbManager.tryRollbackTransaction();
  }
}
