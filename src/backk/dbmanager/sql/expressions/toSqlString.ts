import UserDefinedFilter from '../../../types/userdefinedfilters/UserDefinedFilter';
import SqlInExpression from './SqlInExpression';
import SqlNotInExpression from "./SqlNotInExpression";

export default function toSqlString(
  { fieldName, fieldFunction, operator, value, filters }: UserDefinedFilter,
  index: number | string
): string {
  let fieldExpression = fieldName;
  if (fieldFunction) {
    if (
      fieldFunction !== 'YEAR' &&
      fieldFunction !== 'MONTH' &&
      fieldFunction !== 'DAY' &&
      fieldFunction != 'WEEKDAY' &&
      fieldFunction != 'WEEK' &&
      fieldFunction !== 'QUARTER' &&
      fieldFunction !== 'HOUR' &&
      fieldFunction !== 'MINUTE' &&
      fieldFunction !== 'SECOND'
    ) {
      fieldExpression = fieldFunction + '({{' + fieldName + '}})';
    } else {
      fieldExpression = 'EXTRACT(' + fieldFunction + ' FROM {{' + fieldName + '}})';
    }
  }

  if (operator === 'IN') {
    return new SqlInExpression(fieldName, value, fieldExpression).toSqlString();
  } else if(operator === 'NOT IN') {
    return new SqlNotInExpression(fieldName, value, fieldExpression).toSqlString();
  } else if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
    return `${fieldExpression} ${operator}`;
  } else if (!operator) {
    return `${fieldExpression} = :${fieldName}${index}`;
  } else if (operator === 'OR' && filters) {
    return ' (' + filters
      .map((userDefinedFilter, orFilterIndex) => toSqlString(userDefinedFilter, `${index}_${orFilterIndex}`))
      .join(' OR ') + ') ';
  }

  return `${fieldExpression} ${operator} :${fieldName}${index}`;
}
