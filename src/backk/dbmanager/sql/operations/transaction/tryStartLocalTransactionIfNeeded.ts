import PostgreSqlDbManager from "../../../PostgreSqlDbManager";

export default async function tryStartLocalTransactionIfNeeded(dbManager: PostgreSqlDbManager): Promise<boolean> {
  if (
    !dbManager.getClsNamespace()?.get('globalTransaction') &&
    !dbManager.getClsNamespace()?.get('localTransaction')
  ) {
    await dbManager.tryBeginTransaction();
    dbManager.getClsNamespace()?.set('localTransaction', true);
    dbManager
      .getClsNamespace()
      ?.set('dbLocalTransactionCount', dbManager.getClsNamespace()?.get('dbLocalTransactionCount') + 1);
    return true;
  }

  return false;
}
