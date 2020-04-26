import SqlExpression from "./SqlExpression";

export default class SqlInExpression extends SqlExpression {
  constructor(private fieldName: string, private values: any[]) {
    super('')
  }

  toSqlString(): string {
    let sqlExpression = 'IN (';

    this.values.forEach((_, index) => {
      sqlExpression += this.fieldName + (index + 1).toString() + (index === this.values.length - 1 ? '' : ', ');
    });

    return sqlExpression + ')';
  }
}
