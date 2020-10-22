import SqlExpression from './SqlExpression';

export default class SqlInExpression extends SqlExpression {
  constructor(readonly fieldName: string, readonly inExpressionValues?: any[]) {
    super('', {});
  }

  getValues(): object {
    if (this.inExpressionValues) {
      return this.inExpressionValues.reduce(
        (filterValues, value, index) => ({
          ...filterValues,
          [`${this.fieldName}${index + 1}`]: value
        }),
        {}
      );
    }

    return {};
  }

  hasValues(): boolean {
    return this.inExpressionValues !== undefined && this.inExpressionValues.length > 0;
  }

  toSqlString(schema: string, entityName: string): string {
    if (!this.inExpressionValues) {
      return '';
    }

    const values = this.inExpressionValues
      .map((_, index) => ':' + this.fieldName + (index + 1).toString())
      .join(', ');

    return '{{' + this.fieldName + '}} ' + ' IN (' + values + ')';
  }
}
