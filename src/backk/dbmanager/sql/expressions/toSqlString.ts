import UserDefinedFilter from '../../../types/userdefinedfilters/UserDefinedFilter';
import SqlInExpression from "./SqlInExpression";

export default function toSqlString({ fieldName, operator, value }: UserDefinedFilter): string {
  if (operator === 'IN' || operator === 'NOT IN') {
    return new SqlInExpression(fieldName, value).toSqlString();
  } else if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
    return `{{${fieldName}}} ${operator}`;
  } else if (!operator) {
    return `{{${fieldName}}} = :${fieldName}`;
  }

  return `{{${fieldName}}} ${operator} :${fieldName}`;
}
