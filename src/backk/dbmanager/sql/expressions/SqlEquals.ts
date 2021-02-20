import SqlExpression from './SqlExpression';
import shouldUseRandomInitializationVector from "../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../crypt/shouldEncryptValue";
import encrypt from "../../../crypt/encrypt";
import { Entity } from "../../../types/entities/Entity";

export default class SqlEquals<T> extends SqlExpression {
  constructor(private readonly filters: Partial<T>, subEntityPath: string = '') {
    super('', {}, subEntityPath);
  }

  getValues(): Partial<T> {
    return Object.entries(this.filters).reduce((filterValues, [fieldName, fieldValue]) => {
      let finalFieldValue = fieldValue;

      if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
        finalFieldValue = encrypt(fieldValue as any, false);
      }

      return {
        ...filterValues,
        [`${this.subEntityPath.replace('.', 'xx')}xx${fieldName}`]: finalFieldValue
      };
    }, {});
  }

  hasValues(): boolean {
    return true;
  }

  toSqlString(): string {
    return Object.entries(this.filters)
      .filter(([, fieldValue]) => fieldValue !== undefined)
      .map(([fieldName]) => `${fieldName} = :${this.subEntityPath.replace('.', 'xx')}xx${fieldName}`)
      .join(' AND ');
  }
}
