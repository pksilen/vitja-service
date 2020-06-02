import SqlExpression from './SqlExpression';

export default class SqlInExpression extends SqlExpression {
  constructor(readonly inExpressionValues?: any[]) {
    super();
  }

  toSqlString(schema: string, entityName: string, fieldName: string): string {
    if (!this.inExpressionValues) {
      return '';
    }

    const values = this.inExpressionValues
      .map((_, index) => ':' + fieldName + (index + 1).toString())
      .join(', ');

    return (
      (fieldName.includes('.') ? fieldName : schema + '.' + entityName + '.' + fieldName) +
      ' IN (' +
      values +
      ')'
    );
  }
}
