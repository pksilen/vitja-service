import AbstractDbManager from '../../../AbstractDbManager';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import tryAlterOrCreateTable from './tryAlterOrCreateTable';
import tryCreateIndex from './tryCreateIndex';
import tryCreateUniqueIndex from './tryCreateUniqueIndex';
import log, { logError, Severity } from "../../../../observability/logging/log";

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
      Object.entries(entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap),
      async ([entityName, additionalPropertyNames]: [any, any]) => {
        const fields = await dbManager.tryExecuteSqlWithoutCls(
          `SELECT * FROM ${dbManager.schema}.${entityName} LIMIT 1`
        );

        await forEachAsyncParallel(additionalPropertyNames, async (additionalPropertyName: any) => {
          if (!fields.find((field) => field.name.toLowerCase() === additionalPropertyName.toLowerCase())) {
            let alterTableStatement = `ALTER TABLE ${dbManager.schema}.${entityName} ADD `;
            alterTableStatement += additionalPropertyName + ' BIGINT';
            await dbManager.tryExecuteSqlWithoutCls(alterTableStatement);
          }
        });
      }
    );
  } catch (error) {
    logError(error);
    return false;
  }

  dbManagerToIsInitializedMap[`${dbManager.getDbHost()}`] = true;
  log(Severity.INFO, 'Database initialized', '');
  return true;
}
