import SqlExpression from './SqlExpression';

export default class SqlEquals<T> extends SqlExpression {
  constructor(subEntityPath: string, private readonly filters: Partial<T>) {
    super(subEntityPath, '', {});
  }

  getValues(): Partial<T> {
    return Object.entries(this.filters).reduce((filterValues, [fieldName, fieldValue]) => {
      return {
        ...filterValues,
        [`${this.subEntityPath.replace('.', 'xx')}xx${fieldName}`]: fieldValue
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
