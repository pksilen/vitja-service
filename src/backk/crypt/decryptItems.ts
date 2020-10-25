import decrypt from './decrypt';
import encrypt from './encrypt';
import shouldEncryptValue from './shouldEncryptValue';
import getTypeMetadata from "../metadata/getTypeMetadata";

function decryptItemValues(item: { [key: string]: any }, EntityClass: new () => any, Types: object) {
  if (item === null) {
    return;
  }

  Object.entries(item).forEach(([propertyName, propertyValue]) => {
    if (Array.isArray(propertyValue) && propertyValue.length > 0) {
      if (typeof propertyValue[0] === 'object') {
        const entityMetadata = getTypeMetadata(EntityClass);
        propertyValue.forEach((pv: any) => {
          decryptItemValues(pv, (Types as any)[entityMetadata[propertyName].slice(0, -2)], Types);
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
    } else if (typeof propertyValue === 'object') {
      const entityMetadata = getTypeMetadata(EntityClass);
      decryptItemValues(propertyValue, (Types as any)[entityMetadata[propertyName]], Types);
    } else if (propertyValue !== null && shouldEncryptValue(propertyName, EntityClass)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(EntityClass.name + '.' + propertyName + ' must be string in order to encrypt it');
      }
      const decrypted = decrypt(propertyValue);
      item[propertyName] = decrypted;
    }
  });
}

export default function decryptItems<T extends { [key: string]: any }>(
  items: T[],
  entityClass: new () => T,
  Types: object
) {
  items.forEach((item) => decryptItemValues(item, entityClass, Types));
}
