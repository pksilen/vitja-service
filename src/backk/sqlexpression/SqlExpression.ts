export default abstract class SqlExpression {
  abstract toSqlString(fieldName: string): string;
}
