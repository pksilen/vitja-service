import PostgreSqlDbManager from "../../../PostgreSqlDbManager";

export default function cleanupLocalTransactionIfNeeded(isInsideTransaction: boolean, dbManager: PostgreSqlDbManager) {
  if (isInsideTransaction) {
    dbManager.getClsNamespace()?.set('localTransaction', false);
  }
}
