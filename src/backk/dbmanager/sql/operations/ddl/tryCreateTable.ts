import forEachAsyncSequential from '../../../../utils/forEachAsyncSequential';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import typeAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager from '../../../AbstractDbManager';
import getEnumSqlColumnType from './utils/getEnumSqlColumnType';
import setSubEntityInfo from './utils/setSubEntityInfo';
import getSqlColumnType from './utils/getSqlColumnType';
import createArrayValuesTable from './utils/createArrayValuesTable';
import addArrayValuesTableJoinSpec from './utils/addArrayValuesTableJoinSpec';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import isEnumTypeName from "../../../../utils/type/isEnumTypeName";
import typePropertyAnnotationContainer
  from "../../../../decorators/typeproperty/typePropertyAnnotationContainer";

export default async function tryCreateTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined
) {
  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(entityClass as any);
  let createTableStatement = `CREATE TABLE ${schema}.${entityName} (`;
  let fieldCnt = 0;
  const idColumn = Object.keys(entityMetadata).find((fieldName) => fieldName === '_id' || fieldName === 'id');

  await forEachAsyncSequential(
    Object.entries({ ...entityMetadata, ...(idColumn ? {} : { id: 'string' }) }),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      if (typePropertyAnnotationContainer.isTypePropertyTransient(entityClass, fieldName)) {
        return;
      }

      const { baseTypeName, isArrayType, isNullableType } = getTypeInfoForTypeName(fieldTypeName);
      let sqlColumnType;

      if (fieldName === '_id') {
        sqlColumnType = 'BIGSERIAL PRIMARY KEY';
      } else {
        sqlColumnType = getSqlColumnType(fieldName, baseTypeName);
      }

      if (!sqlColumnType && isEnumTypeName(baseTypeName)) {
        sqlColumnType = getEnumSqlColumnType(baseTypeName);
      }

      if (!sqlColumnType && isEntityTypeName(baseTypeName)) {
        setSubEntityInfo(entityName, entityClass, fieldName, baseTypeName);
      } else if (isArrayType) {
        await createArrayValuesTable(
          schema,
          entityName,
          fieldName,
          sqlColumnType ?? '',
          dbManager
        );
        const foreignIdFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
        addArrayValuesTableJoinSpec(entityName, fieldName, foreignIdFieldName);
      } else {
        if (fieldCnt > 0) {
          createTableStatement += ', ';
        }
        const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
        createTableStatement +=
          fieldName + ' ' + sqlColumnType + (isNullableType || fieldName === 'id' ? '' : ' NOT NULL') + (isUnique ? ' UNIQUE' : '');
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
