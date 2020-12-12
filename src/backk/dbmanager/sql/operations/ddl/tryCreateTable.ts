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
import isEnumTypeName from '../../../../utils/type/isEnumTypeName';
import typePropertyAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';

export default async function tryCreateTable(
  dbManager: AbstractDbManager,
  entityName: string,
  EntityClass: Function,
  schema: string | undefined
) {
  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass as any);
  let createTableStatement = `CREATE TABLE ${schema?.toLowerCase()}.${entityName.toLowerCase()} (`;
  let fieldCnt = 0;
  const idColumn = Object.keys(entityMetadata).find((fieldName) => fieldName === '_id' || fieldName === 'id');

  await forEachAsyncSequential(
    Object.entries({ ...entityMetadata, ...(idColumn ? {} : { id: 'string' }) }),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
        return;
      }

      const { baseTypeName, isArrayType, isNullableType } = getTypeInfoForTypeName(fieldTypeName);
      let sqlColumnType;

      if (fieldName === '_id') {
        sqlColumnType = dbManager.getIdColumnType();
      } else {
        sqlColumnType = getSqlColumnType(dbManager, EntityClass, fieldName, baseTypeName);
      }

      if (!sqlColumnType && isEnumTypeName(baseTypeName)) {
        sqlColumnType = getEnumSqlColumnType(dbManager, baseTypeName);
      }

      if (!sqlColumnType && isEntityTypeName(baseTypeName)) {
        setSubEntityInfo(entityName, EntityClass, fieldName, baseTypeName, isArrayType);
      } else if (!isArrayType) {
        if (fieldCnt > 0) {
          createTableStatement += ', ';
        }
        const isUnique = typeAnnotationContainer.isTypePropertyUnique(EntityClass, fieldName);
        createTableStatement +=
          fieldName.toLowerCase() +
          ' ' +
          sqlColumnType +
          (isNullableType || fieldName === 'id' ? '' : ' NOT NULL') +
          (isUnique ? ' UNIQUE' : '');
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

  await forEachAsyncSequential(
    Object.entries({ ...entityMetadata, ...(idColumn ? {} : { id: 'string' }) }),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
        return;
      }

      const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
      let sqlColumnType;

      if (fieldName === '_id') {
        sqlColumnType = dbManager.getIdColumnType();
      } else {
        sqlColumnType = getSqlColumnType(dbManager, EntityClass, fieldName, baseTypeName);
      }

      if (!sqlColumnType && isEnumTypeName(baseTypeName)) {
        sqlColumnType = getEnumSqlColumnType(dbManager, baseTypeName);
      }

      if (!isEntityTypeName(baseTypeName) && isArrayType) {
        await createArrayValuesTable(schema, entityName, fieldName, sqlColumnType ?? '', dbManager);
        const foreignIdFieldName = entityName.charAt(0).toLowerCase() + entityName.slice(1) + 'Id';
        addArrayValuesTableJoinSpec(entityName, fieldName, foreignIdFieldName);
      }
    }
  );
}
