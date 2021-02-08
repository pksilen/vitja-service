import AbstractDbManager from '../../../AbstractDbManager';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import tryAlterOrCreateTable from './tryAlterOrCreateTable';
import tryCreateIndex from './tryCreateIndex';
import tryCreateUniqueIndex from './tryCreateUniqueIndex';
import log, { logError, Severity } from '../../../../observability/logging/log';
import initializeCronJobSchedulingTable from '../../../../scheduling/initializeCronJobSchedulingTable';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import MongoDbManager from '../../../MongoDbManager';
import tryCreateMongoDbIndex from '../../../mongodb/tryCreateMongoDbIndex';
import setJoinSpecs from '../../../mongodb/setJoinSpecs';

const dbManagerToIsInitializedMap: { [key: string]: boolean } = {};

export function isDbInitialized(dbManager: AbstractDbManager): boolean {
  return dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`];
}
export default async function initializeDatabase(dbManager: AbstractDbManager): Promise<boolean> {
  if (!await dbManager.isDbReady()) {
    return false;
  }

  try {
    if (dbManager instanceof AbstractSqlDbManager) {
      await forEachAsyncParallel(
        Object.entries(entityAnnotationContainer.entityNameToClassMap),
        async ([entityName, entityClass]: [any, any]) =>
          await tryAlterOrCreateTable(dbManager, entityName, entityClass, dbManager.schema)
      );

      await forEachAsyncParallel(
        Object.entries(entityAnnotationContainer.indexNameToIndexFieldsMap),
        async ([indexName, indexFields]: [any, any]) =>
          await tryCreateIndex(dbManager, indexName, dbManager.schema, indexFields)
      );

      await forEachAsyncParallel(
        Object.entries(entityAnnotationContainer.indexNameToUniqueIndexFieldsMap),
        async ([indexName, indexFields]: [any, any]) =>
          await tryCreateUniqueIndex(dbManager, indexName, dbManager.schema, indexFields)
      );

      await forEachAsyncSequential(
        Object.entries(entityAnnotationContainer.entityNameToForeignIdFieldNamesMap),
        async ([entityName, foreignIdFieldNames]: [any, any]) => {
          let tableName = entityName.toLowerCase();

          if (entityAnnotationContainer.entityNameToTableNameMap[entityName]) {
            tableName = entityAnnotationContainer.entityNameToTableNameMap[entityName].toLowerCase();
          }

          const fields = await dbManager.tryExecuteSqlWithoutCls(
            `SELECT * FROM ${dbManager.schema.toLowerCase()}.${tableName} LIMIT 1`,
            undefined,
            false
          );

          await forEachAsyncParallel(foreignIdFieldNames, async (foreignIdFieldName: any) => {
            if (!fields.find((field) => field.name.toLowerCase() === foreignIdFieldName.toLowerCase())) {
              const alterTableStatementPrefix = `ALTER TABLE ${dbManager.schema.toLowerCase()}.${tableName} ADD `;
              const addForeignIdColumnStatement =
                alterTableStatementPrefix + foreignIdFieldName.toLowerCase() + ' BIGINT';
              await dbManager.tryExecuteSqlWithoutCls(addForeignIdColumnStatement);

              const addPrimaryKeyStatement =
                alterTableStatementPrefix +
                'PRIMARY KEY (' +
                foreignIdFieldName.toLowerCase() +
                (entityAnnotationContainer.entityNameToIsArrayMap[entityName] ? ', id)' : ')');
              await dbManager.tryExecuteSqlWithoutCls(addPrimaryKeyStatement);

              const addForeignKeyStatement =
                alterTableStatementPrefix +
                'FOREIGN KEY (' +
                foreignIdFieldName.toLowerCase() +
                ') REFERENCES ' +
                dbManager.schema.toLowerCase() +
                '.' +
                foreignIdFieldName.toLowerCase().slice(0, -2) +
                '(_id)';
              await dbManager.tryExecuteSqlWithoutCls(addForeignKeyStatement);
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
            let subEntityName = subEntityForeignIdFieldName.slice(0, -2);
            subEntityName = subEntityName.charAt(0).toUpperCase() + subEntityName.slice(1);
            let subEntityTableName = subEntityName.toLowerCase();

            if (entityAnnotationContainer.entityNameToTableNameMap[subEntityName]) {
              subEntityTableName = entityAnnotationContainer.entityNameToTableNameMap[
                subEntityName
              ].toLowerCase();
            }

            const createTableStatement = `
          CREATE TABLE ${dbManager.schema.toLowerCase()}.${associationTableName.toLowerCase()}
           (${entityForeignIdFieldName.toLowerCase()} BIGINT,
            ${subEntityForeignIdFieldName.toLowerCase()} BIGINT,
             PRIMARY KEY(${entityForeignIdFieldName.toLowerCase()},
              ${subEntityForeignIdFieldName.toLowerCase()}),
               FOREIGN KEY(${entityForeignIdFieldName.toLowerCase()}) 
               REFERENCES ${dbManager.schema.toLowerCase()}.${entityForeignIdFieldName
              .toLowerCase()
              .slice(0, -2)}(_id),
            FOREIGN KEY(${subEntityForeignIdFieldName.toLowerCase()}) 
               REFERENCES ${dbManager.schema.toLowerCase()}.${subEntityTableName}(_id))`;

            await dbManager.tryExecuteSqlWithoutCls(createTableStatement);
          }
        }
      );
    } else if (dbManager instanceof MongoDbManager) {
      await forEachAsyncParallel(
        Object.entries(entityAnnotationContainer.indexNameToIndexFieldsMap),
        async ([indexName, indexFields]: [any, any]) =>
          await tryCreateMongoDbIndex(dbManager, indexName, dbManager.schema, indexFields)
      );

      await forEachAsyncParallel(
        Object.entries(entityAnnotationContainer.indexNameToUniqueIndexFieldsMap),
        async ([indexName, indexFields]: [any, any]) =>
          await tryCreateMongoDbIndex(dbManager, indexName, dbManager.schema, indexFields, true)
      );

      Object.entries(entityAnnotationContainer.entityNameToClassMap).forEach(([entityName, entityClass]) =>
        setJoinSpecs(dbManager, entityName, entityClass)
      );
    }

    await initializeCronJobSchedulingTable(dbManager);
  } catch (error) {
    logError(error);
    return false;
  }

  dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`] = true;
  log(Severity.INFO, 'Database initialized', '');
  return true;
}
