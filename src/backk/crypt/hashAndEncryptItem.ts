import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import encrypt from './encrypt';
import hash from './hash';
import shouldEncryptValue from './shouldEncryptValue';
import shouldHashValue from './shouldHashValue';
import shouldUseRandomInitializationVector from './shouldUseRandomInitializationVector';
import getPropertyNameToPropertyTypeNameMap from '../metadata/getPropertyNameToPropertyTypeNameMap';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';

async function hashOrEncryptEntityValues(
  entity: { [key: string]: any },
  EntityClass: new () => any,
  Types: object
) {
  await forEachAsyncParallel(Object.entries(entity), async ([propertyName, propertyValue]) => {
    if (Array.isArray(propertyValue) && propertyValue.length > 0) {
      if (typeof propertyValue[0] === 'object' && propertyValue[0] !== null) {
        const entityMetadata = getPropertyNameToPropertyTypeNameMap(EntityClass);
        await forEachAsyncParallel(propertyValue, async (pv: any) => {
          await hashOrEncryptEntityValues(
            pv,
            (Types as any)[getTypeInfoForTypeName(entityMetadata[propertyName]).baseTypeName],
            Types
          );
        });
      } else if (shouldHashValue(propertyName, EntityClass)) {
        await forEachAsyncParallel(propertyValue, async (_, index) => {
          if (propertyValue[index] !== null) {
            if (typeof propertyValue[index] !== 'string') {
              throw new Error(
                EntityClass.name + '.' + propertyName + ' must be string array in order to hash it'
              );
            }
            propertyValue[index] = await hash(propertyValue[index]);
          }
        });
      } else if (shouldEncryptValue(propertyName, EntityClass)) {
        await forEachAsyncParallel(propertyValue, async (_, index) => {
          if (propertyValue[index] !== null) {
            if (typeof propertyValue[index] !== 'string') {
              throw new Error(
                EntityClass.name + '.' + propertyName + ' must be string array in order to encrypt it'
              );
            }
            propertyValue[index] = encrypt(propertyValue[index]);
          }
        });
      }
    } else if (typeof propertyValue === 'object' && propertyValue !== null) {
      const entityMetadata = getPropertyNameToPropertyTypeNameMap(EntityClass);
      await hashOrEncryptEntityValues(
        propertyValue,
        (Types as any)[getTypeInfoForTypeName(entityMetadata[propertyName]).baseTypeName],
        Types
      );
    } else if (propertyValue !== null && shouldHashValue(propertyName, EntityClass)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(EntityClass.name + '.' + propertyName + ' must be string in order to hash it');
      }
      entity[propertyName] = await hash(propertyValue);
    } else if (propertyValue !== null && shouldEncryptValue(propertyName, EntityClass)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(EntityClass.name + '.' + propertyName + ' must be string in order to encrypt it');
      }
      entity[propertyName] = encrypt(propertyValue, shouldUseRandomInitializationVector(propertyName));
    }
  });
}

export default async function hashAndEncryptItem<T extends { [key: string]: any }>(
  item: T,
  entityClass: new () => T,
  Types: object
) {
  await hashOrEncryptEntityValues(item, entityClass, Types);
}
