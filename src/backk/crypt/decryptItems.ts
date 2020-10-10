import decrypt from './decrypt';
import encrypt from './encrypt';
import shouldEncryptValue from './shouldEncryptValue';

function decryptItemValues(item: { [key: string]: any }, entityName: string) {
  Object.entries(item).forEach(([propertyName, propertyValue]) => {
    if (Array.isArray(propertyValue) && propertyValue.length > 0) {
      if (typeof propertyValue[0] === 'object') {
        propertyValue.forEach((pv: any) => {
          decryptItemValues(pv, entityName + propertyName);
        });
      } else if (shouldEncryptValue(propertyName, propertyName)) {
        if (typeof propertyValue[0] !== 'string') {
          throw new Error(entityName + '.' + propertyName + ' must be string array in order to encrypt it');
        }
        propertyValue.forEach((_, index) => {
          propertyValue[index] = encrypt(propertyValue[index]);
        });
      }
    }
    if (typeof propertyValue === 'object') {
      decryptItemValues(propertyValue, entityName);
    } else if (shouldEncryptValue(propertyName, entityName)) {
      if (typeof propertyValue !== 'string') {
        throw new Error(entityName + '.' + propertyName + ' must be string in order to encrypt it');
      }
      const decrypted = decrypt(propertyValue);
      item[propertyName] = decrypted;
    }
  });
}

export default function decryptItems<T extends { [key: string]: any }>(items: T[], entityClass: new () => T) {
  items.forEach((item) => decryptItemValues(item, entityClass.name));
}
