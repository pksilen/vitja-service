import forEachAsyncParallel from '../forEachAsyncParallel';
import encrypt from './encrypt';
import hash from './hash';
import shouldEncryptValue from './shouldEncryptValue';
import shouldHashValue from './shouldHashValue';
import shouldUseRandomInitializationVector from './shouldUseRandomInitializationVector';

async function hashOrEncryptItemValues(item: { [key: string]: any }, entityName?: string) {
  await forEachAsyncParallel(Object.entries(item), async ([propertyName, propertyValue]) => {
    if (Array.isArray(propertyValue) && propertyValue.length > 0) {
      if (typeof propertyValue[0] === 'object') {
        await forEachAsyncParallel(propertyValue, async (pv: any) => {
          await hashOrEncryptItemValues(pv, entityName + propertyName);
        });
      } else if (shouldHashValue(propertyName)) {
        if (typeof propertyValue[0] !== 'string') {
          throw new Error(entityName + '.' + propertyName + ' must be string array in order to hash it');
        }
        await forEachAsyncParallel(propertyValue, async (_, index) => {
          propertyValue[index] = await hash(propertyValue[index]);
        });
      } else if (shouldEncryptValue(propertyName, propertyName)) {
        if (typeof propertyValue[0] !== 'string') {
          throw new Error(entityName + '.' + propertyName + ' must be string array in order to encrypt it');
        }
        await forEachAsyncParallel(propertyValue, async (_, index) => {
          propertyValue[index] = encrypt(propertyValue[index]);
        });
      }
    }
    if (typeof propertyValue === 'object') {
      await hashOrEncryptItemValues(propertyValue, propertyName);
    } else if (shouldHashValue(propertyName)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(entityName + '.' + propertyName + ' must be string in order to hash it');
      }
      item[propertyName] = await hash(propertyValue);
    } else if (shouldEncryptValue(propertyName, entityName)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(entityName + '.' + propertyName + ' must be string in order to encrypt it');
      }
      item[propertyName] = encrypt(propertyValue, shouldUseRandomInitializationVector(propertyName));
    }
  });
}

export default async function hashAndEncryptItem<T extends { [key: string]: any }>(
  item: T,
  entityClass?: new () => T
) {
  await hashOrEncryptItemValues(item, entityClass?.name);
}
