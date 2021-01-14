import SqlExpression from './SqlExpression';
import SqlInExpression from "./SqlInExpression";

export default class SqlNotInExpression extends SqlInExpression {
  constructor(
    readonly fieldName: string,
    readonly notInExpressionValues?: any[],
    readonly fieldExpression?: string
  ) {
    super(fieldName, notInExpressionValues, fieldExpression);
  }

  toSqlString(): string {
    if (!this.inExpressionValues) {
      return '';
    }

    const values = this.inExpressionValues
      .map((_, index) => ':' + this.fieldName.replace('_', 'xx') + (index + 1).toString())
      .join(', ');

    return (
      '{{' + (this.fieldExpression ? this.fieldExpression : this.fieldName) + '}} ' + ' NOT IN (' + values + ')'
    );
  }
}
