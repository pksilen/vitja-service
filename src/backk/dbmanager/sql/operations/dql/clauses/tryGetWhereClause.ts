import SqlExpression from '../../../expressions/SqlExpression';
import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from '../utils/columns/getSqlColumnFromProjection';
import createErrorMessageWithStatusCode from '../../../../../errors/createErrorMessageWithStatusCode';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import toSqlString from '../../../expressions/toSqlString';

export default function tryGetWhereClause<T>(
  schema: string,
  filters: Partial<T> | SqlExpression[] | UserDefinedFilter[],
  entityClass: Function,
  Types: object
) {
  let filtersSql: string;

  if (Array.isArray(filters) && filters.length > 0) {
    if (filters[0] instanceof SqlExpression) {
      filtersSql = (filters as SqlExpression[])
        .filter((sqlExpression) => sqlExpression.hasValues())
        .map((sqlExpression) => sqlExpression.toSqlString())
        .join(' AND ');
    } else {
      filtersSql = (filters as UserDefinedFilter[])
        .map((userDefinedFilter, index) => toSqlString(userDefinedFilter, index))
        .join(' AND ');
    }
  } else {
    filtersSql = Object.entries(filters)
      .filter(([, fieldValue]) => fieldValue !== undefined)
      .map(([fieldName]) => `{{${fieldName}}} = :${fieldName}`)
      .join(' AND ');
  }

  const fieldNameTemplates = filtersSql.match(/{{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*}}/g);
  (fieldNameTemplates ?? []).forEach((fieldNameTemplate) => {
    const fieldName = fieldNameTemplate
      .split('{{')[1]
      .split('}}')[0]
      .trim();

    let projection;
    try {
      projection = tryGetProjection(schema, { includeResponseFields: [fieldName] }, entityClass, Types);
    } catch (error) {
      throw new Error(createErrorMessageWithStatusCode('Invalid filter field: ' + fieldName, 400));
    }

    const sqlColumn = getSqlColumnFromProjection(projection);
    filtersSql = filtersSql.replace(new RegExp(fieldNameTemplate, 'g'), sqlColumn);
  });

  return filtersSql ? `WHERE ${filtersSql}` : '';
}
