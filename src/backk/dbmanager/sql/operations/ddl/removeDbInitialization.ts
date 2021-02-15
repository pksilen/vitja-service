import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import AbstractDbManager from '../../../AbstractDbManager';

let intervalId: NodeJS.Timeout | undefined = undefined;

export default async function removeDbInitialization(dbManager: AbstractDbManager) {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  if (!(dbManager instanceof AbstractSqlDbManager)) {
    const removeAppVersionSql = `DELETE FROM ${dbManager.schema.toLowerCase()}.__backk_db_initialization WHERE appversion =
    ${process.env.npm_package_version}`;

    try {
      await dbManager.tryExecuteSqlWithoutCls(removeAppVersionSql);
      return true;
    } catch (error) {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }

      intervalId = setInterval(() => removeDbInitialization(dbManager), 120000);
    }
  }
}
