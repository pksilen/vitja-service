import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';
import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import isEntityTypeName from '../../utils/type/isEntityTypeName';

export default function getRootProjection(
  projection: object,
  EntityClass: new () => any,
  Types: any,
  subEntityPath = ''
): object {
  const entityClassPropertyNameToPropertyTypeNameMap = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  const rootProjection = Object.entries(entityClassPropertyNameToPropertyTypeNameMap).reduce(
    (otherRootProjection, [propertyName, propertyTypeName]) => {
      const { baseTypeName } = getTypeInfoForTypeName(propertyTypeName);
      let subEntityProjection = {};

      if (
        isEntityTypeName(baseTypeName) &&
        !typePropertyAnnotationContainer.isTypePropertyManyToMany(EntityClass, propertyName)
      ) {
        subEntityProjection = getRootProjection(projection, Types[baseTypeName], Types, propertyName);
      }

      const entityProjection = Object.entries(projection).reduce(
        (entityProjection, [projectionFieldPathName, shouldIncludeField]) => {
          const fieldPathName = subEntityPath ? subEntityPath + '.' + propertyName : propertyName;
          let newEntityProjection = entityProjection;

          if (projectionFieldPathName === fieldPathName) {
            newEntityProjection = { ...newEntityProjection, [fieldPathName]: shouldIncludeField };
          } else if (
            projectionFieldPathName.length > fieldPathName.length &&
            projectionFieldPathName.startsWith(fieldPathName)
          ) {
            newEntityProjection = { ...newEntityProjection, [fieldPathName]: shouldIncludeField };
          }

          return newEntityProjection;
        },
        {}
      );

      return { ...otherRootProjection, ...entityProjection, ...subEntityProjection };
    },
    {}
  );

  Object.keys(rootProjection).forEach((fieldName) => {
    if (!fieldName.includes('.')) {
      const foundFieldName = Object.keys(rootProjection).find(otherFieldName => otherFieldName === fieldName + '.');
      if (foundFieldName) {
        delete (rootProjection as any)[fieldName];
      }
    }
  });

  return rootProjection;
}
