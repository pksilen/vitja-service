import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import isEntityTypeName from './isEntityTypeName';
import getTypeInfoForTypeName from './getTypeInfoForTypeName';

export default function isExternalIdProperty(
  filterPathName: string,
  Types: any,
  EntityClass: new () => any,
  subEntityPath = ''
): boolean {
  const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
  let isExternalId = false;

  Object.entries(entityPropertyNameToPropertyTypeNameMap).forEach(([propertyName, propertyTypeName]) => {
    const fieldPathName = subEntityPath ? subEntityPath + '.' + propertyName : propertyName;
    if (
      fieldPathName === fieldPathName &&
      typePropertyAnnotationContainer.isTypePropertyExternalId(EntityClass, propertyName)
    ) {
      isExternalId = true;
    } else if (isEntityTypeName(propertyTypeName)) {
      const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
      isExternalId = isExternalIdProperty(filterPathName, Types, Types[baseTypeName], propertyName);
    }
  });

  return isExternalId;
}
