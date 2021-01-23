import getClassPropertyNameToPropertyTypeNameMap
  from "../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import getTypeInfoForTypeName from "../../utils/type/getTypeInfoForTypeName";
import typePropertyAnnotationContainer from "../../decorators/typeproperty/typePropertyAnnotationContainer";
import isEntityTypeName from "../../utils/type/isEntityTypeName";

export default function getRootProjection(
  projection: object,
  EntityClass: new () => any,
  Types: any,
  subEntityPath = ''
): object {
  const entityClassPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  return Object.entries(entityClassPropertyNameToPropertyTypeNameMap).reduce(
    (otherRootProjection, [propertyName, propertyTypeName]) => {
      const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);

      let subEntityProjection = {};
      if (isEntityTypeName(baseTypeName) && !typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)) {
        subEntityProjection = getRootProjection(
          projection,
          Types[baseTypeName],
          Types,
          propertyName + '.'
        );
      }

      const entityProjection = Object.entries(projection).reduce(
        (entityProjection, [fieldPathName, shouldIncludeField]) => {
          const wantedFieldPathName = subEntityPath ? subEntityPath + '.' + propertyName : propertyName;
          if (fieldPathName === wantedFieldPathName) {
            return { ...entityProjection, [fieldPathName]: shouldIncludeField };
          }
          return entityProjection;
        },
        {}
      );

      return { ...otherRootProjection, ...entityProjection, ...subEntityProjection };
    },
    {}
  );
}
