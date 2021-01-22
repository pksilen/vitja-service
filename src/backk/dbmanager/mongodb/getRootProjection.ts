import getClassPropertyNameToPropertyTypeNameMap
  from "../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import getTypeInfoForTypeName from "../../utils/type/getTypeInfoForTypeName";
import typePropertyAnnotationContainer from "../../decorators/typeproperty/typePropertyAnnotationContainer";

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

      if (!typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)) {
        const subSubEntityProjection = getRootProjection(
          projection,
          Types[baseTypeName],
          Types,
          propertyName + '.'
        );

        const subEntityProjection = Object.entries(projection).reduce(
          (subEntityProjection, [fieldPathName, shouldIncludeField]) => {
            const wantedFieldPathName = subEntityPath ? subEntityPath + '.' + propertyName : propertyName;
            if (fieldPathName === wantedFieldPathName) {
              return { ...subEntityProjection, [fieldPathName]: shouldIncludeField };
            }
            return subEntityProjection;
          },
          {}
        );

        return { ...otherRootProjection, ...subEntityProjection, ...subSubEntityProjection };
      }

      return otherRootProjection;
    },
    {}
  );
}
