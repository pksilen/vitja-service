import SqlExpression from '../../../expressions/SqlExpression';
import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from '../utils/columns/getSqlColumnFromProjection';
import createErrorMessageWithStatusCode from '../../../../../errors/createErrorMessageWithStatusCode';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import convertUserDefinedFilterToSqlString from '../utils/convertUserDefinedFilterToSqlString';
import SubPagination from '../../../../../types/postqueryoperations/SubPagination';
import AbstractSqlDbManager from "../../../../AbstractSqlDbManager";

export default function tryGetWhereClause<T>(
  dbManager: AbstractSqlDbManager,
  filters: Partial<T> | SqlExpression[] | UserDefinedFilter[],
  subPaginations: SubPagination[] | undefined,
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
        .map((userDefinedFilter, index) => convertUserDefinedFilterToSqlString(userDefinedFilter, index))
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
      projection = tryGetProjection(dbManager, { includeResponseFields: [fieldName] }, entityClass, Types);
    } catch (error) {
      throw new Error(createErrorMessageWithStatusCode('Invalid filter field: ' + fieldName, 400));
    }

    const sqlColumn = getSqlColumnFromProjection(projection);
    filtersSql = filtersSql.replace(new RegExp(fieldNameTemplate, 'g'), sqlColumn);
  });

  if (subPaginations && subPaginations.length > 0) {
    const rankFilters = subPaginations.map(({ fieldName, pageNumber, pageSize }) => {
      const minRank = (pageNumber - 1) * pageSize;
      const maxRank = minRank + pageSize;
      const rankFieldName = fieldName.replace('.', '_') + '_rank';
      return `${rankFieldName} >= ${minRank} AND ${rankFieldName} < ${maxRank}`;
    });

    filtersSql = filtersSql ? ' AND ' + rankFilters.join(' AND ') : rankFilters.join(' AND ');
  }

  return filtersSql ? `WHERE ${filtersSql}` : '';
}
