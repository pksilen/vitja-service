import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import typeAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager, { Field } from '../../../AbstractDbManager';
import getEnumSqlColumnType from './utils/getEnumSqlColumnType';
import getSqlColumnType from './utils/getSqlColumnType';
import setSubEntityInfo from './utils/setSubEntityInfo';
import createArrayValuesTable from './utils/createArrayValuesTable';
import addArrayValuesTableJoinSpec from './utils/addArrayValuesTableJoinSpec';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../utils/type/isEntityTypeName';
import isEnumTypeName from "../../../../utils/type/isEnumTypeName";

export default async function tryAlterTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined,
  databaseFields: Field[]
) {
  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(entityClass as any);
  await forEachAsyncParallel(
    Object.entries(entityMetadata),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      const doesFieldExistInDatabase = !!databaseFields.find(
        (field) => field.name.toLowerCase() === fieldName.toLowerCase()
      );

      if (!doesFieldExistInDatabase) {
        let alterTableStatement = `ALTER TABLE ${schema}.${entityName} ADD `;
        const { baseTypeName, isArrayType, isNullableType } = getTypeInfoForTypeName(fieldTypeName);
        let sqlColumnType = getSqlColumnType(fieldName, baseTypeName);

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
          const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
          alterTableStatement +=
            fieldName +
            ' ' +
            sqlColumnType +
            (isNullableType || fieldName === 'id' ? '' : ' NOT NULL') +
            (isUnique ? ' UNIQUE' : '');
          await dbManager.tryExecuteSqlWithoutCls(alterTableStatement);
        }
      }
    }
  );
}
