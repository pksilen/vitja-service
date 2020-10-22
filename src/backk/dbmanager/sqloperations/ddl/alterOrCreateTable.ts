import AbstractDbManager from "../../AbstractDbManager";
import alterTable from "./alterTable";
import createTable from "./createTable";

export default async function alterOrCreateTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined
) {
  try {
    const fields = await dbManager.tryExecuteSqlWithoutCls(`SELECT * FROM ${schema}.${entityName} LIMIT 1`);
    await alterTable(dbManager, entityName, entityClass, schema, fields);
  } catch (error) {
    await createTable(dbManager, entityName, entityClass, schema);
  }
}
