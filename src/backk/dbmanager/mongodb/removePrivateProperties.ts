import typePropertyAnnotationContainer from '../../decorators/typeproperty/typePropertyAnnotationContainer';
import getClassPropertyNameToPropertyTypeNameMap from '../../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../../utils/type/getTypeInfoForTypeName';

function removeEntityPrivateProperties<T>(entity: any, EntityClass: new () => any, Types: object) {
  const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);

  Object.entries(entity).forEach(([propertyName, propertyValue]: [string, any]) => {
    if (typePropertyAnnotationContainer.isTypePropertyPrivate(EntityClass, propertyName)) {
      delete entity[propertyName];
    }

    const propertyTypeInfo = getTypeInfoForTypeName(entityMetadata[propertyName]);
    const SubEntityClass = (Types as any)[propertyTypeInfo.baseTypeName];

    if (SubEntityClass && propertyValue !== null) {
      if (propertyTypeInfo.isArrayType) {
        propertyValue.forEach((subValue: any) =>
          removeEntityPrivateProperties(subValue, SubEntityClass, Types)
        );
      } else {
        removeEntityPrivateProperties(propertyValue, SubEntityClass, Types);
      }
    }
  });
}

export default function removePrivateProperties(entities: any[], EntityClass: new () => any, Types: object) {
  entities.forEach((entity) => {
    removeEntityPrivateProperties(entity, EntityClass, Types);
  });
}
