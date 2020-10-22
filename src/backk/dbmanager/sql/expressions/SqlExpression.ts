
export default class SqlExpression {
  constructor(readonly expression: string, readonly values?: object) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toSqlString(schema: string, entityName: string): string {
    return this.expression;
  }

  getValues(): object | undefined {
    return this.values;
  }

  hasValues(): boolean {
    return Object.values(this.values || {}).reduce(
      (hasValues: boolean, value: any) => hasValues && value !== undefined,
      true
    );
  }
}
