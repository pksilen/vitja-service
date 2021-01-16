import getClassPropertyNameToPropertyTypeNameMap from '../../../../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../../../../decorators/typeproperty/typePropertyAnnotationContainer';
import isEntityTypeName from '../../../../../utils/type/isEntityTypeName';
import getTypeInfoForTypeName from '../../../../../utils/type/getTypeInfoForTypeName';

export default function isUniqueField(
  fieldName: string,
  EntityClass: new () => any,
  Types: any,
  fieldPath = ''
): boolean {
  const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  return Object.entries(entityPropertyNameToPropertyTypeNameMap).reduce(
    (isUniqueFieldResult: boolean, [propertyName, propertyTypeName]) => {
      if (
        fieldPath + propertyName === fieldName &&
        typePropertyAnnotationContainer.isTypePropertyUnique(EntityClass, fieldName)
      ) {
        return true;
      }

      if (isEntityTypeName(propertyTypeName)) {
        const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
        return (
          isUniqueFieldResult || isUniqueField(fieldName, Types[baseTypeName], Types, propertyName + '.')
        );
      }

      return isUniqueFieldResult;
    },
    false
  );
}
