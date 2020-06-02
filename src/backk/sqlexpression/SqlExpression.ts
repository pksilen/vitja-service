export default abstract class SqlExpression {
  abstract toSqlString(schema: string, entityName: string, fieldName: string): string;
}
