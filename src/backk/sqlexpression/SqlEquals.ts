import SqlExpression from './SqlExpression';

export default class SqlEquals<T> extends SqlExpression {
  constructor(private readonly filters: Partial<T>) {
    super('', {});
  }

  getValues(): Partial<T> {
    return this.filters;
  }

  hasValues(): boolean {
    return true;
  }

  toSqlString(): string {
    return Object.entries(this.filters)
      .filter(([, fieldValue]) => fieldValue !== undefined)
      .map(([fieldName]) => `{{${fieldName}}} = :${fieldName}`)
      .join(' AND ');
  }
}
