import AbstractDbManager from '../../../../AbstractDbManager';

export default async function createAdditionalTable(
  schema: string | undefined,
  entityName: string,
  fieldName: string,
  sqlColumnType: string,
  dbManager: AbstractDbManager
): Promise<string> {
  const idFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';

  try {
    await dbManager.tryExecuteSqlWithoutCls(`SELECT * FROM ${schema}.${entityName + fieldName.slice(0, -1)}`);
  } catch {
    let createAdditionalTableStatement = `CREATE TABLE ${schema}.${entityName +
    fieldName.slice(0, -1)} (`;

    createAdditionalTableStatement +=
      'id BIGINT, ' + idFieldName + ' BIGINT, ' + fieldName.slice(0, -1) + ' ' + sqlColumnType + ')';

    await dbManager.tryExecuteSqlWithoutCls(createAdditionalTableStatement);
  }

  return idFieldName;
}
