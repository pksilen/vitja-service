import AbstractDbManager from "../../../../AbstractDbManager";

export default function updateDbTransactionCount(dbManager: AbstractDbManager) {
  if (
    !dbManager.getClsNamespace()?.get('localTransaction') &&
    !dbManager.getClsNamespace()?.get('globalTransaction')
  ) {
    dbManager
      .getClsNamespace()
      ?.set('dbTransactionCount', dbManager.getClsNamespace()?.get('dbTransactionCount') + 1);
  }
}
