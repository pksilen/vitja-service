import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import AbstractDbManager from "../../../AbstractDbManager";

export default async function removeDbInitialization(dbManager: AbstractDbManager) {
  if (!(dbManager instanceof AbstractSqlDbManager)) {
    const removeAppVersionSql = `DELETE FROM ${dbManager.schema.toLowerCase()}.__backk_db_initialization WHERE appversion =
    ${process.env.npm_package_version}`;

    try {
      await dbManager.tryExecuteSqlWithoutCls(removeAppVersionSql);
      return true;
    } catch (error) {
      // NO operation
    }
  }
}
