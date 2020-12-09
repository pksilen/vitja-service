import AbstractSqlDbManager from "../../../AbstractSqlDbManager";

export default async function tryCommitLocalTransactionIfNeeded(isInTransaction: boolean, dbManager: AbstractSqlDbManager) {
  if (isInTransaction && !dbManager.getClsNamespace()?.get('globalTransaction')) {
    await dbManager.tryCommitTransaction();
  }
}
