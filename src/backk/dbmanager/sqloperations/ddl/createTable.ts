import { getTypeMetadata } from '../../../generateServicesMetadata';
import forEachAsyncSequential from '../../../forEachAsyncSequential';
import entityAnnotationContainer from '../../../annotations/entity/entityAnnotationContainer';
import typeAnnotationContainer from '../../../annotations/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager from '../../AbstractDbManager';
import getEnumSqlColumnType from './utils/getEnumSqlColumnType';
import setSubEntityInfo from './utils/setSubEntityInfo';
import getSqlColumnType from './utils/getSqlColumnType';
import createAdditionalTable from './utils/createAdditionalTable';
import addJoinSpec from './utils/addJoinSpec';

export default async function createTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined
) {
  const entityMetadata = getTypeMetadata(entityClass as any);
  let createTableStatement = `CREATE TABLE ${schema}.${entityName} (`;
  let fieldCnt = 0;

  await forEachAsyncSequential(
    Object.entries(entityMetadata),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      let baseFieldTypeName = fieldTypeName;
      let isArray = false;
      let sqlColumnType: string;

      if (fieldTypeName.endsWith('[]')) {
        baseFieldTypeName = fieldTypeName.slice(0, -2);
        isArray = true;
      }

      if (fieldName === '_id') {
        sqlColumnType = 'BIGSERIAL PRIMARY KEY';
      } else {
        sqlColumnType = getSqlColumnType(fieldName, baseFieldTypeName);
      }

      if (!sqlColumnType && baseFieldTypeName[0] === '(') {
        sqlColumnType = getEnumSqlColumnType(baseFieldTypeName, sqlColumnType);
      }

      if (baseFieldTypeName[0] === baseFieldTypeName[0].toUpperCase() && baseFieldTypeName[0] !== '(') {
        setSubEntityInfo(entityName, baseFieldTypeName);
      } else if (isArray) {
        const idFieldName = await createAdditionalTable(
          schema,
          entityName,
          fieldName,
          sqlColumnType,
          dbManager
        );

        addJoinSpec(entityName, fieldName, idFieldName);
      } else {
        if (fieldCnt > 0) {
          createTableStatement += ', ';
        }
        const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
        createTableStatement += fieldName + ' ' + sqlColumnType + (isUnique ? ' UNIQUE' : '');
        fieldCnt++;
      }
    }
  );

  await dbManager.tryExecuteSqlWithoutCls(
    createTableStatement +
      ')' +
      (entityAnnotationContainer.entityNameToAdditionalSqlCreateTableStatementOptionsMap[entityName]
        ? ' ' + entityAnnotationContainer.entityNameToAdditionalSqlCreateTableStatementOptionsMap[entityName]
        : '')
  );
}
