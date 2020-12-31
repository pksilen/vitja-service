import typePropertyAnnotationContainer from "../../decorators/typeproperty/typePropertyAnnotationContainer";
import getClassPropertyNameToPropertyTypeNameMap
  from "../../metadata/getClassPropertyNameToPropertyTypeNameMap";
import getTypeInfoForTypeName from "../../utils/type/getTypeInfoForTypeName";

function removeEntityPrivateProperties<T>(entity: any, EntityClass: new() => any, Types: object) {
  Object.entries(entity).forEach(([key, value]) => {
    if (typePropertyAnnotationContainer.isTypePropertyPrivate(EntityClass, key)) {
      delete entity[key];
    }

    if (typeof value === 'object' && value !== null) {
      const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
      const SubEntityClass = (Types as any)[getTypeInfoForTypeName(entityMetadata[key]).baseTypeName]
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        value.forEach((subValue) => removeEntityPrivateProperties(subValue, SubEntityClass, Types));
      } else {
        removeEntityPrivateProperties(value, SubEntityClass, Types);
      }
    }
  });
}

export default function removePrivateProperties(entities: any[], EntityClass: new() => any, Types: object) {
  entities.forEach(entity => {
    removeEntityPrivateProperties(entity, EntityClass, Types);
  });
}

