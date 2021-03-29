import typePropertyAnnotationContainer from "../../decorators/typeproperty/typePropertyAnnotationContainer";
import getTypeInfoForTypeName from "../../utils/type/getTypeInfoForTypeName";
import isEntityTypeName from "../../utils/type/isEntityTypeName";
import getClassPropertyNameToPropertyTypeNameMap
  from "../../metadata/getClassPropertyNameToPropertyTypeNameMap";

export default function handleNestedOneToManyRelations(
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

    const { baseTypeName } = getTypeInfoForTypeName(fieldTypeName);
    const fieldPathName = subEntityPath + '.' + fieldName;

    const arrayIndex = entity[subEntityPath].id;
    Object.entries(entity[subEntityPath]).forEach(([fieldName, fieldValue]) => {
      if (fieldName !== 'id') {
        entity[`${subEntityPath}.${arrayIndex}.${fieldName}`] = fieldValue;
      }
    });

    delete entity[subEntityPath];

    if (isEntityTypeName(baseTypeName)) {
      handleNestedOneToManyRelations(entity, Types, (Types as any)[baseTypeName], fieldPathName);
    }
  });
}
