import AbstractDbManager from '../../../../AbstractDbManager';

export default async function createArrayValuesTable(
  schema: string | undefined,
  entityName: string,
  fieldName: string,
  sqlColumnType: string,
  dbManager: AbstractDbManager
) {
  const foreignIdFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
  const arrayValueFieldName = fieldName.slice(0, -1);
  const arrayValuesTableName = entityName + '_' + arrayValueFieldName;

  try {
    await dbManager.tryExecuteSqlWithoutCls(
      `SELECT * FROM ${schema}.${arrayValuesTableName}`,
      undefined,
      false
    );
  } catch {
    let createAdditionalTableStatement = `CREATE TABLE ${schema}.${arrayValuesTableName} (`;

    createAdditionalTableStatement +=
      'id BIGINT, ' + foreignIdFieldName + ' BIGINT, ' + arrayValueFieldName + ' ' + sqlColumnType + ')';

    await dbManager.tryExecuteSqlWithoutCls(createAdditionalTableStatement);
  }
}
