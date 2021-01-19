import SqlExpression from './SqlExpression';

export default class SqlInExpression extends SqlExpression {
  constructor(
    subEntityPath: string,
    readonly fieldName: string,
    readonly inExpressionValues?: any[],
    readonly fieldExpression?: string
  ) {
    super(subEntityPath, '', {});
  }

  getValues(): object {
    if (this.inExpressionValues) {
      return this.inExpressionValues.reduce(
        (filterValues, value, index) => ({
          ...filterValues,
          [`${this.subEntityPath.replace('_', 'xx')}xx${this.fieldName.replace('_', 'xx')}${index +
            1}`]: value
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
      .map(
        (_, index) =>
          ':' +
          this.subEntityPath.replace('_', 'xx') +
          'xx' +
          this.fieldName.replace('_', 'xx') +
          (index + 1).toString()
      )
      .join(', ');

    return (this.fieldExpression ?? this.fieldName) + ' IN (' + values + ')';
  }
}
