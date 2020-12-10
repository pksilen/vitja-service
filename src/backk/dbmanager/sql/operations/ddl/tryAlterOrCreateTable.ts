import AbstractDbManager from '../../../AbstractDbManager';
import tryAlterTable from './tryAlterTable';
import tryCreateTable from './tryCreateTable';

export default async function tryAlterOrCreateTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined
) {
  let fields;
  try {
    fields = await dbManager.tryExecuteSqlWithoutCls(
      `SELECT * FROM ${schema}.${entityName} LIMIT 1`,
      undefined,
      false
    );
    console.log(fields);
  } catch (error) {
    await tryCreateTable(dbManager, entityName, entityClass, schema);
    return;
  }

  await tryAlterTable(dbManager, entityName, entityClass, schema, fields);
}
