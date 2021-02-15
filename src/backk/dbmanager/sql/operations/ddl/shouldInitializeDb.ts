import AbstractSqlDbManager from '../../../AbstractSqlDbManager';

export default async function shouldInitializeDb(dbManager: AbstractSqlDbManager) {
  const addAppVersionSql = `INSERT INTO ${dbManager.schema.toLowerCase()}.__backk_db_initialization (appVersion, isInitialized) VALUES ("${
    process.env.npm_package_version
  }", 0)`;

  try {
    await dbManager.tryExecuteSqlWithoutCls(addAppVersionSql);
    return true;
  } catch (error) {
    if (dbManager.isDuplicateEntityError(error)) {
      return false;
    }

    throw error;
  }
}
