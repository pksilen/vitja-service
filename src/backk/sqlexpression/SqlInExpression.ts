import SqlExpression from './SqlExpression';

export default class SqlInExpression extends SqlExpression {
  constructor(private fieldName: string, private values: any[]) {
    super('');
  }

  toSqlString(): string {
    const values = this.values
      .map((_, index) => {
        this.fieldName + (index + 1).toString();
      })
      .join(', ');

    return 'IN (' + values + ')';
  }
}
