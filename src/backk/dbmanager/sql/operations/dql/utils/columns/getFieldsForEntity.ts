import { Projection } from '../../../../../../types/postqueryoperations/Projection';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import shouldIncludeField from './shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../../utils/type/isEntityTypeName';
import AbstractSqlDbManager from '../../../../../AbstractSqlDbManager';
import { doesClassPropertyContainCustomValidation } from '../../../../../../validation/setClassPropertyValidationDecorators';

export default function getFieldsForEntity(
  dbManager: AbstractSqlDbManager,
  fields: string[],
  EntityClass: Function,
  Types: object,
  projection: Projection,
  fieldPath: string,
  isInternalCall = false,
  tableAlias = EntityClass.name.toLowerCase()
) {
  const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(
    EntityClass as any
  );

  Object.entries(entityPropertyNameToPropertyTypeNameMap).forEach(
    ([entityPropertyName, entityPropertyTypeName]: [string, any]) => {
      if (
        (!isInternalCall &&
          typePropertyAnnotationContainer.isTypePropertyPrivate(EntityClass, entityPropertyName)) ||
        (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, entityPropertyName) &&
          !doesClassPropertyContainCustomValidation(EntityClass, entityPropertyName, 'isUndefined'))
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
          tableAlias + '.' + entityPropertyName.toLowerCase()
        );
      } else if (isArrayType) {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          const idFieldName = (
            EntityClass.name.charAt(0).toLowerCase() +
            EntityClass.name.slice(1) +
            'Id'
          ).toLowerCase();

          fields.push(`${dbManager.schema}_${tableAlias}.${idFieldName} AS ${tableAlias}_${idFieldName}`);

          const singularFieldName = entityPropertyName.slice(0, -1).toLowerCase();

          fields.push(
            `${dbManager.schema}_${tableAlias}.${singularFieldName} AS ${tableAlias}_${singularFieldName}`
          );

          fields.push(`${dbManager.schema}_${tableAlias}.id AS ${tableAlias}_id`);
        }
      } else {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          if (
            entityPropertyName === '_id' ||
            entityPropertyName === 'id' ||
            entityPropertyName.endsWith('Id')
          ) {
            fields.push(
              `CAST(${
                dbManager.schema
              }_${tableAlias}.${entityPropertyName.toLowerCase()} AS ${dbManager.getIdColumnCastType()}) AS ${tableAlias}_${entityPropertyName.toLowerCase()}`
            );
          } else {
            fields.push(
              `${
                dbManager.schema
              }_${tableAlias}.${entityPropertyName.toLowerCase()} AS ${tableAlias}_${entityPropertyName.toLowerCase()}`
            );
          }
        }
      }
    }
  );
}
