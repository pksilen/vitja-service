export default class SqlExpression {
  constructor(private sqlExpression: string) {}

  toSqlString(fieldName: string): string {
    return this.sqlExpression;
  }
}
