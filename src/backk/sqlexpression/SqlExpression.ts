export default class SqlExpression {
  constructor(private sqlExpression: string) {}

  toSqlString(): string {
    return this.sqlExpression;
  }
}
