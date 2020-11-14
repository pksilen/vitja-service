import forEachAsyncParallel from '../../../../utils/forEachAsyncParallel';
import typeAnnotationContainer from '../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import AbstractDbManager, { Field } from '../../../AbstractDbManager';
import getEnumSqlColumnType from './utils/getEnumSqlColumnType';
import getSqlColumnType from './utils/getSqlColumnType';
import setSubEntityInfo from './utils/setSubEntityInfo';
import createAdditionalTable from './utils/createAdditionalTable';
import addJoinSpec from './utils/addJoinSpec';
import getPropertyNameToPropertyTypeNameMap from '../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from "../../../../utils/type/getTypeInfoForTypeName";

export default async function tryAlterTable(
  dbManager: AbstractDbManager,
  entityName: string,
  entityClass: Function,
  schema: string | undefined,
  databaseFields: Field[]
) {
  const entityMetadata = getPropertyNameToPropertyTypeNameMap(entityClass as any);
  await forEachAsyncParallel(
    Object.entries(entityMetadata),
    async ([fieldName, fieldTypeName]: [any, any]) => {
      const doesFieldExistInDatabase = !!databaseFields.find(
        (field) => field.name.toLowerCase() === fieldName.toLowerCase()
      );

      if (!doesFieldExistInDatabase) {
        let alterTableStatement = `ALTER TABLE ${schema}.${entityName} ADD `;
        const  { baseTypeName, isArrayType, isNullableType } = getTypeInfoForTypeName(fieldTypeName);
        let sqlColumnType = getSqlColumnType(fieldName, baseTypeName);

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
          const isUnique = typeAnnotationContainer.isTypePropertyUnique(entityClass, fieldName);
          alterTableStatement +=
            fieldName + ' ' + sqlColumnType + (isNullableType ? '' : 'NOT NULL') + (isUnique ? ' UNIQUE' : '');
          await dbManager.tryExecuteSqlWithoutCls(alterTableStatement);
        }
      }
    }
  );
}
