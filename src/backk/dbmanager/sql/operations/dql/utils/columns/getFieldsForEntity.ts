import { Projection } from '../../../../../../types/postqueryoperations/Projection';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import shouldIncludeField from './shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../../utils/type/isEntityTypeName';
import AbstractSqlDbManager from '../../../../../AbstractSqlDbManager';
import getSingularName from "../../../../../../utils/getSingularName";

export default function getFieldsForEntity(
  dbManager: AbstractSqlDbManager,
  fields: string[],
  EntityClass: Function,
  Types: object,
  projection: Projection,
  fieldPath: string,
  isInternalCall = false,
  tableName = ''
) {
  const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(
    EntityClass as any
  );

  Object.entries(entityPropertyNameToPropertyTypeNameMap).forEach(
    ([entityPropertyName, entityPropertyTypeName]: [string, any]) => {
      if (
        (!isInternalCall &&
          typePropertyAnnotationContainer.isTypePropertyPrivate(EntityClass, entityPropertyName)) ||
        typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, entityPropertyName)
      ) {
        return;
      }

      const { baseTypeName, isArrayType } = getTypeInfoForTypeName(entityPropertyTypeName);

      if (isEntityTypeName(baseTypeName)) {
        getFieldsForEntity(
          dbManager,
          fields,
          (Types as any)[baseTypeName],
          Types,
          projection,
          fieldPath + entityPropertyName + '.',
          isInternalCall,
          getSingularName(entityPropertyName)
        );
      } else if (isArrayType) {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          const relationEntityName = (EntityClass.name + '_' + entityPropertyName.slice(0, -1)).toLowerCase();

          const idFieldName = (
            EntityClass.name.charAt(0).toLowerCase() +
            EntityClass.name.slice(1) +
            'Id'
          ).toLowerCase();

          fields.push(
            `${dbManager.schema}_${relationEntityName}.${idFieldName} AS ${relationEntityName}_${idFieldName}`
          );

          const singularFieldName = entityPropertyName.slice(0, -1).toLowerCase();

          fields.push(
            `${dbManager.schema}_${relationEntityName}.${singularFieldName} AS ${relationEntityName}_${singularFieldName}`
          );

          fields.push(`${dbManager.schema}_${relationEntityName}.id AS ${relationEntityName}_id`);
        }
      } else {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          const finalTableName = tableName.toLowerCase() ?? EntityClass.name.toLowerCase();

          if (
            entityPropertyName === '_id' ||
            entityPropertyName === 'id' ||
            entityPropertyName.endsWith('Id')
          ) {
            fields.push(
              `CAST(${
                dbManager.schema
              }_${finalTableName}.${entityPropertyName.toLowerCase()} AS ${dbManager.getIdColumnCastType()}) AS ${finalTableName}_${entityPropertyName.toLowerCase()}`
            );
          } else {
            fields.push(
              `${
                dbManager.schema
              }_${finalTableName}.${entityPropertyName.toLowerCase()} AS ${finalTableName}_${entityPropertyName.toLowerCase()}`
            );
          }
        }
      }
    }
  );
}
