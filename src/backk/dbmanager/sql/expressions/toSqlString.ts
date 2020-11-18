import UserDefinedFilter from '../../../types/userdefinedfilters/UserDefinedFilter';
import SqlInExpression from './SqlInExpression';

export default function toSqlString(
  { fieldName, operator, value, filters }: UserDefinedFilter,
  index: number | string
): string {
  if (operator === 'IN' || operator === 'NOT IN') {
    return new SqlInExpression(fieldName, value).toSqlString();
  } else if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
    return `{{${fieldName}}} ${operator}`;
  } else if (!operator) {
    return `{{${fieldName}}} = :${fieldName}${index}`;
  } else if (operator === 'OR' && filters) {
    return filters
      .map((userDefinedFilter, orFilterIndex) => toSqlString(userDefinedFilter, `${index}_${orFilterIndex}`))
      .join(' OR ');
  }

  return `{{${fieldName}}} ${operator} :${fieldName}${index}`;
}
