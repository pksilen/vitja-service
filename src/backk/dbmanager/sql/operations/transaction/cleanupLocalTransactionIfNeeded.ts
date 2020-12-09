import AbstractSqlDbManager from "../../../AbstractSqlDbManager";

export default function cleanupLocalTransactionIfNeeded(isInsideTransaction: boolean, dbManager: AbstractSqlDbManager) {
  if (isInsideTransaction) {
    dbManager.getClsNamespace()?.set('localTransaction', false);
  }
}
