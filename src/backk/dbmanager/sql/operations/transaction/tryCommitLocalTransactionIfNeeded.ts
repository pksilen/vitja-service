import PostgreSqlDbManager from "../../../PostgreSqlDbManager";

export default async function tryCommitLocalTransactionIfNeeded(isInTransaction: boolean, dbManager: PostgreSqlDbManager) {
  if (isInTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
    await dbManager.tryCommitTransaction();
  }
}
