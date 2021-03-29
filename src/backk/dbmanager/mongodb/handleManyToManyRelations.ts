import _ from 'lodash';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';
import isEntityTypeName from '../../utils/type/isEntityTypeName';
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';

export default function handleManyToManyRelations(
  entity: any,
  Types: object,
  EntityClass: new () => any,
  subEntityPath: string
) {
  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  Object.entries(entityMetadata).forEach(([fieldName, fieldTypeName]) => {
    if (typePropertyAnnotationContainer.isTypePropertyTransient(EntityClass, fieldName)) {
      delete entity[fieldName];
    }

    const { baseTypeName, isArrayType } = getTypeInfoForTypeName(fieldTypeName);
    const fieldPathName = subEntityPath + '.' + fieldName;

    if (
      isArrayType &&
      isEntityTypeName(baseTypeName) &&
      typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, fieldName)
    ) {
      if (Array.isArray(_.get(entity, subEntityPath))) {
        _.get(entity, subEntityPath).forEach((subEntity: any, index: number) => {
          const fieldPathName = subEntityPath + '[' + index + ']' +'.' + fieldName;
          _.set(
            entity,
            fieldPathName,
            (_.get(entity, fieldPathName) ?? []).map((subEntity: any) => subEntity._id)
          );
        });
      } else {
        _.set(
          entity,
          fieldPathName,
          (_.get(entity, fieldPathName) ?? []).map((subEntity: any) => subEntity._id)
        );
      }
    } else if (isEntityTypeName(baseTypeName)) {
      handleManyToManyRelations(entity, Types, (Types as any)[baseTypeName], fieldPathName);
    }
  });
}
