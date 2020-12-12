import AbstractDbManager from '../../../AbstractDbManager';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import tryAlterOrCreateTable from './tryAlterOrCreateTable';
import tryCreateIndex from './tryCreateIndex';
import tryCreateUniqueIndex from './tryCreateUniqueIndex';
import log, { logError, Severity } from '../../../../observability/logging/log';
import initializeCronJobSchedulingTable from '../../../../scheduling/initializeCronJobSchedulingTable';

const dbManagerToIsInitializedMap: { [key: string]: boolean } = {};

export function isDbInitialized(dbManager: AbstractDbManager): boolean {
  return dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`];
}
export default async function initializeDatabase(dbManager: AbstractDbManager): Promise<boolean> {
  if (!dbManager.isDbReady()) {
    return false;
  }

  try {
    await forEachAsyncParallel(
      Object.entries(entityAnnotationContainer.entityNameToClassMap),
      async ([entityName, entityClass]: [any, any]) =>
        await tryAlterOrCreateTable(dbManager, entityName, entityClass, dbManager.schema)
    );

    await forEachAsyncParallel(
      Object.entries(entityAnnotationContainer.entityNameToIndexFieldsMap),
      async ([entityName, indexFields]: [any, any]) =>
        await tryCreateIndex(dbManager, entityName, dbManager.schema, indexFields)
    );

    await forEachAsyncParallel(
      Object.entries(entityAnnotationContainer.entityNameToUniqueIndexFieldsMap),
      async ([entityName, indexFields]: [any, any]) =>
        await tryCreateUniqueIndex(dbManager, entityName, dbManager.schema, indexFields)
    );

    await forEachAsyncSequential(
      Object.entries(entityAnnotationContainer.entityNameToForeignIdFieldNamesMap),
      async ([entityName, foreignIdFieldNames]: [any, any]) => {
        const fields = await dbManager.tryExecuteSqlWithoutCls(
          `SELECT * FROM ${dbManager.schema.toLowerCase()}.${entityName.toLowerCase()} LIMIT 1`,
          undefined,
          false
        );

        await forEachAsyncParallel(foreignIdFieldNames, async (foreignIdFieldName: any) => {
          if (!fields.find((field) => field.name.toLowerCase() === foreignIdFieldName.toLowerCase())) {
            const alterTableStatementPrefix = `ALTER TABLE ${dbManager.schema.toLowerCase()}.${entityName.toLowerCase()} ADD `;
            const addForeignIdColumnStatement =
              alterTableStatementPrefix + foreignIdFieldName.toLowerCase() + ' BIGINT';
            await dbManager.tryExecuteSqlWithoutCls(addForeignIdColumnStatement);
            const addPrimaryKeyStatement =
              alterTableStatementPrefix + 'PRIMARY KEY (' + foreignIdFieldName.toLowerCase() + (entityAnnotationContainer.entityNameToIsArrayMap[entityName] ? ', id)' : ')');
            await dbManager.tryExecuteSqlWithoutCls(addPrimaryKeyStatement);
          }
        });
      }
    );

    await forEachAsyncSequential(
      entityAnnotationContainer.manyToManyRelationTableSpecs,
      async ({ associationTableName, entityForeignIdFieldName, subEntityForeignIdFieldName }) => {
        try {
          await dbManager.tryExecuteSqlWithoutCls(
            `SELECT * FROM ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} LIMIT 1`,
            undefined,
            false
          );
        } catch (error) {
          const createTableStatement = `CREATE TABLE ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()} (${entityForeignIdFieldName.toLowerCase()} BIGINT, ${subEntityForeignIdFieldName.toLowerCase()} BIGINT, PRIMARY KEY(${entityForeignIdFieldName.toLowerCase()}, ${subEntityForeignIdFieldName.toLowerCase()}))`;
          await dbManager.tryExecuteSqlWithoutCls(createTableStatement);
        }
      }
    );

    initializeCronJobSchedulingTable(dbManager);
  } catch (error) {
    logError(error);
    return false;
  }

  dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`] = true;
  log(Severity.INFO, 'Database initialized', '');
  return true;
}
