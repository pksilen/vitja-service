import getClassPropertyNameToPropertyTypeNameMap from './getClassPropertyNameToPropertyTypeNameMap';
import isEntityTypeName from '../utils/type/isEntityTypeName';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';

export default function findParentEntityAndPropertyNameForSubEntity(
  EntityClass: new () => any,
  SubEntityClass: new () => any,
  Types: any
): [Function, string] | undefined {
  const entityPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  const foundPropertyEntry = Object.entries(entityPropertyNameToPropertyTypeNameMap).find(
    ([, propertyTypeName]) => getTypeInfoForTypeName(propertyTypeName).baseTypeName === SubEntityClass.name
  );

  if (foundPropertyEntry) {
    return [EntityClass, foundPropertyEntry[0]];
  }

  return Object.entries(entityPropertyNameToPropertyTypeNameMap).reduce(
    (foundPropertyName: [Function, string] | undefined, [, propertyTypeName]) => {
      const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
      if (isEntityTypeName(baseTypeName)) {
        return (
          foundPropertyName ||
          findParentEntityAndPropertyNameForSubEntity(Types[baseTypeName], SubEntityClass, Types)
        );
      }
      return foundPropertyName;
    },
    undefined
  );
}
