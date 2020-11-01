import SqlExpression from '../../../expressions/SqlExpression';
import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from '../utils/columns/getSqlColumnFromProjection';
import createErrorMessageWithStatusCode from "../../../../../errors/createErrorMessageWithStatusCode";

export default function tryGetWhereClause<T>(
  schema: string,
  filters: Partial<T> | SqlExpression[],
  entityClass: Function,
  Types: object
) {
  let filtersSql: string;

  if (Array.isArray(filters)) {
    filtersSql = filters
      .filter((sqlExpression) => sqlExpression.hasValues())
      .map((sqlExpression) => sqlExpression.toSqlString(schema, entityClass.name))
      .join(' AND ');
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
