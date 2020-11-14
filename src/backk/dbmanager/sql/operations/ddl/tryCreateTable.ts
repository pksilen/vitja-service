import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import typeAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager from '../../../AbstractDbManager';
import getEnumSqlColumnType from './utils/getEnumSqlColumnType';
import setSubEntityInfo from './utils/setSubEntityInfo';
import getSqlColumnType from './utils/getSqlColumnType';
import createAdditionalTable from './utils/createAdditionalTable';
import addJoinSpec from './utils/addJoinSpec';
import getPropertyNameToPropertyTypeNameMap from '../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from "../../../../utils/type/getTypeInfoForTypeName";

export default async function tryCreateTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined
) {
  const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);
  let createTableStatement = `CREATE TABLE ${schema}.${entityName} (`;
  let fieldCnt = 0;
  const idColumn = Object.keys(entityMetadata).find((fieldName) => fieldName === '_id' || fieldName === 'id');

  await forEachAsyncSequential(
    Object.entries({ ...entityMetadata, ...(idColumn ? {} : { id: 'string' }) }),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      const {baseTypeName, isArrayType, isNullableType } = getTypeInfoForTypeName(fieldTypeName);
      let sqlColumnType

      if (fieldName === '_id') {
        sqlColumnType = 'BIGSERIAL PRIMARY KEY';
      } else {
        sqlColumnType = getSqlColumnType(fieldName, baseTypeName);
      }

      if (!sqlColumnType && baseTypeName[0] === '(') {
        sqlColumnType = getEnumSqlColumnType(baseTypeName);
      }

      if (
        !sqlColumnType &&
        baseTypeName[0] === baseTypeName[0].toUpperCase() &&
        baseTypeName[0] !== '('
      ) {
        setSubEntityInfo(entityName, baseTypeName);
      } else if (isArrayType) {
        const idFieldName = await createAdditionalTable(
          schema,
          entityName,
          fieldName,
          sqlColumnType ?? '',
          dbManager
        );

        addJoinSpec(entityName, fieldName, idFieldName);
      } else {
        if (fieldCnt > 0) {
          createTableStatement += ', ';
        }
        const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
        createTableStatement +=
          fieldName + ' ' + sqlColumnType + (isNullableType ? '' : 'NOT NULL') + (isUnique ? ' UNIQUE' : '');
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
