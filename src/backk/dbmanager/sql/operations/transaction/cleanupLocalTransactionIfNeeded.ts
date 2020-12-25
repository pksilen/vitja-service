import AbstractDbManager from "../../../AbstractDbManager";

export default async function cleanupLocalTransactionIfNeeded(isInsideTransaction: boolean, dbManager: AbstractDbManager) {
  if (isInsideTransaction) {
    dbManager.getClsNamespace()?.set('localTransaction', false);
    await dbManager.cleanupTransaction();
  }
}
