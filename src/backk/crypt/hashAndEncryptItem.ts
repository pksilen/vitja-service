import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { getTypeMetadata } from '../service/generateServicesMetadata';
import encrypt from './encrypt';
import hash from './hash';
import shouldEncryptValue from './shouldEncryptValue';
import shouldHashValue from './shouldHashValue';
import shouldUseRandomInitializationVector from './shouldUseRandomInitializationVector';

async function hashOrEncryptItemValues(
  item: { [key: string]: any },
  EntityClass: new () => any,
  Types: object
) {
  await forEachAsyncParallel(Object.entries(item), async ([propertyName, propertyValue]) => {
    if (Array.isArray(propertyValue) && propertyValue.length > 0) {
      if (typeof propertyValue[0] === 'object') {
        const entityMetadata = getTypeMetadata(EntityClass);
        await forEachAsyncParallel(propertyValue, async (pv: any) => {
          await hashOrEncryptItemValues(pv, (Types as any)[entityMetadata[propertyName].slice(0, -2)], Types);
        });
      } else if (shouldHashValue(propertyName, EntityClass)) {
        if (typeof propertyValue[0] !== 'string') {
          throw new Error(
            EntityClass.name + '.' + propertyName + ' must be string array in order to hash it'
          );
        }
        await forEachAsyncParallel(propertyValue, async (_, index) => {
          propertyValue[index] = await hash(propertyValue[index]);
        });
      } else if (shouldEncryptValue(propertyName, EntityClass)) {
        if (typeof propertyValue[0] !== 'string') {
          throw new Error(
            EntityClass.name + '.' + propertyName + ' must be string array in order to encrypt it'
          );
        }
        await forEachAsyncParallel(propertyValue, async (_, index) => {
          propertyValue[index] = encrypt(propertyValue[index]);
        });
      }
    } else if (typeof propertyValue === 'object') {
      const entityMetadata = getTypeMetadata(EntityClass);
      await hashOrEncryptItemValues(propertyValue, (Types as any)[entityMetadata[propertyName]], Types);
    } else if (shouldHashValue(propertyName, EntityClass)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(EntityClass.name + '.' + propertyName + ' must be string in order to hash it');
      }
      item[propertyName] = await hash(propertyValue);
    } else if (shouldEncryptValue(propertyName, EntityClass)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(EntityClass.name + '.' + propertyName + ' must be string in order to encrypt it');
      }
      item[propertyName] = encrypt(propertyValue, shouldUseRandomInitializationVector(propertyName));
    }
  });
}

export default async function hashAndEncryptItem<T extends { [key: string]: any }>(
  item: T,
  entityClass: new () => T,
  Types: object
) {
  await hashOrEncryptItemValues(item, entityClass, Types);
}
