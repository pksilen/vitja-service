import { Projection } from '../../../../../../types/postqueryoperations/Projection';
import getPropertyNameToPropertyTypeNameMap from '../../../../../../metadata/getPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import shouldIncludeField from './shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../../utils/type/getTypeInfoForTypeName';

export default function getFieldsForEntity(
  schema: string,
  fields: string[],
  EntityClass: Function,
  Types: object,
  projection: Projection,
  fieldPath: string,
  isInternalCall = false
) {
  const entityPropertyNameToPropertyTypeNameMap = getPropertyNameToPropertyTypeNameMap(EntityClass as any);

  Object.entries(entityPropertyNameToPropertyTypeNameMap).forEach(
    ([entityPropertyName, entityPropertyTypeName]: [string, any]) => {
      if (
        !isInternalCall &&
        typePropertyAnnotationContainer.isTypePropertyPrivate(EntityClass, entityPropertyName)
      ) {
        return;
      }

      const { baseTypeName, isArrayType } = getTypeInfoForTypeName(entityPropertyTypeName);

      if (
        baseTypeName !== 'Date' &&
        baseTypeName[0] === baseTypeName[0].toUpperCase() &&
        baseTypeName[0] !== '('
      ) {
        getFieldsForEntity(
          schema,
          fields,
          (Types as any)[baseTypeName],
          Types,
          projection,
          fieldPath + entityPropertyName + '.'
        );
      } else if (isArrayType) {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          const relationEntityName = EntityClass.name + entityPropertyName.slice(0, -1);
          const idFieldName = EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
          fields.push(
            `${schema}.${relationEntityName}.${idFieldName} AS ${relationEntityName}_${idFieldName}`
          );

          const singularFieldName = entityPropertyName.slice(0, -1);

          fields.push(
            `${schema}.${relationEntityName}.${singularFieldName} AS ${relationEntityName}_${singularFieldName}`
          );
          fields.push(`${schema}.${relationEntityName}.id AS ${relationEntityName}_id`);
        }
      } else {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          if (
            entityPropertyName === '_id' ||
            entityPropertyName === 'id' ||
            entityPropertyName.endsWith('Id')
          ) {
            fields.push(
              `CAST(${schema}.${EntityClass.name}.${entityPropertyName} AS VARCHAR) AS ${EntityClass.name}_${entityPropertyName}`
            );
          } else {
            fields.push(
              `${schema}.${EntityClass.name}.${entityPropertyName} AS ${EntityClass.name}_${entityPropertyName}`
            );
          }
        }
      }
    }
  );
}
