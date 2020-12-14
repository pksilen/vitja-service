import { Projection } from '../../../../../../types/postqueryoperations/Projection';
import getClassPropertyNameToPropertyTypeNameMap from '../../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import shouldIncludeField from './shouldIncludeField';
import getTypeInfoForTypeName from '../../../../../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../../../../../utils/type/isEntityTypeName';
import AbstractSqlDbManager from '../../../../../AbstractSqlDbManager';

export default function getFieldsForEntity(
  dbManager: AbstractSqlDbManager,
  fields: string[],
  EntityClass: Function,
  Types: object,
  projection: Projection,
  fieldPath: string,
  isInternalCall = false
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
          fieldPath + entityPropertyName + '.'
        );
      } else if (isArrayType) {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          const relationEntityName = EntityClass.name + '_' + entityPropertyName.slice(0, -1);
          const idFieldName = EntityClass.name.charAt(0).toLowerCase() + EntityClass.name.slice(1) + 'Id';
          fields.push(
            `${dbManager.schema.toLowerCase()}.${relationEntityName.toLowerCase()}.${idFieldName.toLowerCase()} AS ${relationEntityName.toLowerCase()}_${idFieldName.toLowerCase()}`
          );

          const singularFieldName = entityPropertyName.slice(0, -1);

          fields.push(
            `${dbManager.schema.toLowerCase()}.${relationEntityName.toLowerCase()}.${singularFieldName.toLowerCase()} AS ${relationEntityName.toLowerCase()}_${singularFieldName.toLowerCase()}`
          );
          fields.push(
            `${dbManager.schema.toLowerCase()}.${relationEntityName.toLowerCase()}.id AS ${relationEntityName.toLowerCase()}_id`
          );
        }
      } else {
        if (shouldIncludeField(entityPropertyName, fieldPath, projection)) {
          if (
            entityPropertyName === '_id' ||
            entityPropertyName === 'id' ||
            entityPropertyName.endsWith('Id')
          ) {
            fields.push(
              `CAST(${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()}.${entityPropertyName.toLowerCase()} AS ${dbManager.getIdColumnCastType()}) AS ${EntityClass.name.toLowerCase()}_${entityPropertyName.toLowerCase()}`
            );
          } else {
            fields.push(
              `${dbManager.schema.toLowerCase()}.${EntityClass.name.toLowerCase()}.${entityPropertyName.toLowerCase()} AS ${EntityClass.name.toLowerCase()}_${entityPropertyName.toLowerCase()}`
            );
          }
        }
      }
    }
  );
}
