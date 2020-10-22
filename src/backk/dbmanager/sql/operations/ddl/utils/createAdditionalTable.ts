import AbstractDbManager from '../../../../AbstractDbManager';

export default async function createAdditionalTable(
  schema: string | undefined,
  entityName: string,
  fieldName: string,
  sqlColumnType: string,
  dbManager: AbstractDbManager
) {
  let createAdditionalTableStatement = `CREATE TABLE IF NOT EXISTS ${schema}.${entityName +
    fieldName.slice(0, -1)} (`;

  const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';

  createAdditionalTableStatement +=
    'id BIGINT, ' + idFieldName + ' BIGINT, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';

  await dbManager.tryExecuteSqlWithoutCls(createAdditionalTableStatement);
  return idFieldName;
}
