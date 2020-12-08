import decrypt from './decrypt';
import encrypt from './encrypt';
import shouldEncryptValue from './shouldEncryptValue';
import getClassPropertyNameToPropertyTypeNameMap from '../metadata/getClassPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';

function decryptItemValues(entity: { [key: string]: any }, EntityClass: new () => any, Types: object) {
  if (entity === null) {
    return;
  }

  Object.entries(entity).forEach(([propertyName, propertyValue]) => {
    if (Array.isArray(propertyValue) && propertyValue.length > 0) {
      if (typeof propertyValue[0] === 'object' && propertyValue[0] !== null) {
        const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
        propertyValue.forEach((pv: any) => {
          decryptItemValues(
            pv,
            (Types as any)[getTypeInfoForTypeName(entityMetadata[propertyName]).baseTypeName],
            Types
          );
        });
      } else if (shouldEncryptValue(propertyName, EntityClass)) {
        if (typeof propertyValue[0] !== 'string') {
          throw new Error(
            EntityClass.name + '.' + propertyName + ' must be string array in order to encrypt it'
          );
        }
        propertyValue.forEach((_, index) => {
          propertyValue[index] = encrypt(propertyValue[index]);
        });
      }
    } else if (typeof propertyValue === 'object' && propertyValue !== null) {
      const entityMetadata = getClassPropertyNameToPropertyTypeNameMap(EntityClass);
      decryptItemValues(
        propertyValue,
        (Types as any)[getTypeInfoForTypeName(entityMetadata[propertyName]).baseTypeName],
        Types
      );
    } else if (
      propertyValue !== null &&
      propertyValue !== undefined &&
      shouldEncryptValue(propertyName, EntityClass)
    ) {
      if (typeof propertyValue !== 'string') {
        throw new Error(EntityClass.name + '.' + propertyName + ' must be string in order to encrypt it');
      }
      entity[propertyName] = decrypt(propertyValue);
    }
  });
}

export default function decryptItems<T extends { [key: string]: any }>(
  entities: T[],
  EntityClass: new () => T,
  Types: object
) {
  entities.forEach((entity) => decryptItemValues(entity, EntityClass, Types));
}
