import SqlExpression from './SqlExpression';

export default class SqlInExpression extends SqlExpression {
  constructor(
    readonly fieldName: string,
    readonly inExpressionValues?: any[],
    readonly fieldExpression?: string
  ) {
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

  toSqlString(): string {
    if (!this.inExpressionValues) {
      return '';
    }

    const values = this.inExpressionValues
      .map((_, index) => ':' + this.fieldName + (index + 1).toString())
      .join(', ');

    return (
      '{{' + (this.fieldExpression ? this.fieldExpression : this.fieldName) + '}} ' + ' IN (' + values + ')'
    );
  }
}
