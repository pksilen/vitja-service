import AbstractDbManager from '../../../AbstractDbManager';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import tryAlterOrCreateTable from './tryAlterOrCreateTable';
import tryCreateIndex from './tryCreateIndex';
import tryCreateUniqueIndex from './tryCreateUniqueIndex';
import log, { logError, Severity } from '../../../../observability/logging/log';
import tryInitializeCronJobSchedulingTable from '../../../../scheduling/tryInitializeCronJobSchedulingTable';
import AbstractSqlDbManager from '../../../AbstractSqlDbManager';
import MongoDbManager from '../../../MongoDbManager';
import tryCreateMongoDbIndex from '../../../mongodb/tryCreateMongoDbIndex';
import setJoinSpecs from '../../../mongodb/setJoinSpecs';
import { createNamespace } from 'cls-hooked';
import BaseService from '../../../../service/BaseService';
import serviceFunctionAnnotationContainer from '../../../../decorators/service/function/serviceFunctionAnnotationContainer';
import { ErrorResponse } from "../../../../types/ErrorResponse";
import isErrorResponse from "../../../../errors/isErrorResponse";

const dbManagerToIsInitializedMap: { [key: string]: boolean } = {};

export function isDbInitialized(dbManager: AbstractDbManager): boolean {
  return dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`];
}

export default async function initializeDatabase(
  controller: any | undefined,
  dbManager: AbstractDbManager
): Promise<boolean> {
  if (!(await dbManager.isDbReady())) {
    return false;
  }

  if (!controller) {
    return false;
  }

  try {
    if (dbManager instanceof AbstractSqlDbManager) {
      const clsNamespace = createNamespace('serviceFunctionExecution');
      await clsNamespace.runAndReturn(async () => {
        await dbManager.tryReserveDbConnectionFromPool();

        await dbManager.executeInsideTransaction(async () => {
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

              const fields = await dbManager.tryExecuteSql(
                `SELECT * FROM ${dbManager.schema.toLowerCase()}.${tableName} LIMIT 1`,
                undefined,
                false
              );

              await forEachAsyncParallel(foreignIdFieldNames, async (foreignIdFieldName: any) => {
                if (!fields.find((field) => field.name.toLowerCase() === foreignIdFieldName.toLowerCase())) {
                  const alterTableStatementPrefix = `ALTER TABLE ${dbManager.schema.toLowerCase()}.${tableName} ADD `;

                  const addForeignIdColumnStatement =
                    alterTableStatementPrefix + foreignIdFieldName.toLowerCase() + ' BIGINT';

                  await dbManager.tryExecuteSql(addForeignIdColumnStatement);

                  const addPrimaryKeyStatement =
                    alterTableStatementPrefix +
                    'PRIMARY KEY (' +
                    foreignIdFieldName.toLowerCase() +
                    (entityAnnotationContainer.entityNameToIsArrayMap[entityName] ? ', id)' : ')');

                  await dbManager.tryExecuteSql(addPrimaryKeyStatement);

                  const addForeignKeyStatement =
                    alterTableStatementPrefix +
                    'FOREIGN KEY (' +
                    foreignIdFieldName.toLowerCase() +
                    ') REFERENCES ' +
                    dbManager.schema.toLowerCase() +
                    '.' +
                    foreignIdFieldName.toLowerCase().slice(0, -2) +
                    '(_id)';

                  await dbManager.tryExecuteSql(addForeignKeyStatement);
                }
              });
            }
          );

          await forEachAsyncSequential(
            entityAnnotationContainer.manyToManyRelationTableSpecs,
            async ({ associationTableName, entityForeignIdFieldName, subEntityForeignIdFieldName }) => {
              try {
                await dbManager.tryExecuteSql(
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

                await dbManager.tryExecuteSql(createTableStatement);
              }
            }
          );

          const serviceNameToServiceEntries = Object.entries(controller).filter(
            ([, service]: [string, any]) => service instanceof BaseService
          );

          await forEachAsyncParallel(serviceNameToServiceEntries, async ([, service]: [string, any]) => {
            await forEachAsyncParallel(
              Object.getOwnPropertyNames(Object.getPrototypeOf(service)),
              async (functionName: string) => {
                if (serviceFunctionAnnotationContainer.hasOnStartUp(service.constructor, functionName)) {
                  const possibleErrorResponse = await service[functionName]();

                  if (isErrorResponse(possibleErrorResponse)) {
                    throw new Error((possibleErrorResponse as ErrorResponse).errorMessage);
                  }
                }
              }
            );
          });
        });

        dbManager.tryReleaseDbConnectionBackToPool();
      });
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

    await tryInitializeCronJobSchedulingTable(dbManager);
  } catch (error) {
    logError(error);
    return false;
  }

  dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`] = true;
  log(Severity.INFO, 'Database initialized', '');
  return true;
}
