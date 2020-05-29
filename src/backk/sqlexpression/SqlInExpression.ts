import SqlExpression from './SqlExpression';

export default class SqlInExpression extends SqlExpression {
  constructor(readonly values?: any[]) {
    super();
  }

  toSqlString(fieldName: string): string {
    if (!this.values) {
      return '';
    }

    const values = this.values.map((_, index) => ':' + fieldName + (index + 1).toString()).join(', ');
    return fieldName + ' IN (' + values + ')';
  }
}
