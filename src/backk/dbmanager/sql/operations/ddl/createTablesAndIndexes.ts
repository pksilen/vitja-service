import AbstractDbManager from '../../../AbstractDbManager';
import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import alterOrCreateTable from "./alterOrCreateTable";
import createIndex from "./createIndex";
import createUniqueIndex from "./createUniqueIndex";

export default async function createTablesAndIndexes(dbManager: AbstractDbManager) {
  await forEachAsyncParallel(
    Object.entries(entityAnnotationContainer.entityNameToClassMap),
    async ([entityName, entityClass]: [any, any]) => {
      try {
        await alterOrCreateTable(dbManager, entityName, entityClass, dbManager.schema);
      } catch (error) {
        console.log(error);
      }
    }
  );

  await forEachAsyncParallel(
    Object.entries(entityAnnotationContainer.entityNameToIndexFieldsMap),
    async ([entityName, indexFields]: [any, any]) => {
      try {
        await createIndex(dbManager, entityName, dbManager.schema, indexFields);
      } catch (error) {
        console.log(error);
      }
    }
  );

  await forEachAsyncParallel(
    Object.entries(entityAnnotationContainer.entityNameToUniqueIndexFieldsMap),
    async ([entityName, indexFields]: [any, any]) => {
      try {
        await createUniqueIndex(dbManager, entityName, dbManager.schema, indexFields);
      } catch (error) {
        console.log(error);
      }
    }
  );

  await forEachAsyncSequential(
    Object.entries(entityAnnotationContainer.entityNameToAdditionalIdPropertyNamesMap),
    async ([entityName, additionalPropertyNames]: [any, any]) => {
      try {
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
      } catch (error) {
        console.log(error);
      }
    }
  );
}
