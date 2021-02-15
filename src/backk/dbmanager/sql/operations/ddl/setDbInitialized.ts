import AbstractSqlDbManager from '../../../AbstractSqlDbManager';

export default async function setDbInitialized(dbManager: AbstractSqlDbManager) {
  const modifyAppVersionInitializationSql = `UPDATE ${dbManager.schema.toLowerCase()}.__backk_db_initialization SET isinitialized = 1 WHERE appversion = "${
    process.env.npm_package_version
  }"`;

  await dbManager.tryExecuteSqlWithoutCls(modifyAppVersionInitializationSql);
}
