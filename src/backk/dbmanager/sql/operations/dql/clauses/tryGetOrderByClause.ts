import _ from 'lodash';
import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from '../utils/columns/getSqlColumnFromProjection';
import assertIsSortDirection from '../../../../../assertions/assertIsSortDirection';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import getFieldsForEntity from '../utils/columns/getFieldsForEntity';
import createErrorMessageWithStatusCode from '../../../../../errors/createErrorMessageWithStatusCode';

export default function tryGetOrderByClause<T>(
  schema: string,
  sortBys: SortBy[] | undefined,
  entityClass: new () => T,
  Types: object
) {
  const fields: string[] = [];
  getFieldsForEntity(schema, fields, entityClass, Types, {}, '', true);
  const idFields = fields.filter(
    (field) => field.endsWith('.id') && !sortBys?.find(({ sortField }) => field !== sortField)
  );
  const sortedIdFields = _.sortBy(idFields, (field) => field.length);
  const idFieldsSortBys = sortedIdFields.join(' ASC, ');

  if (sortBys) {
    const sortBysStr = sortBys.map(({ sortField, sortDirection }) => {
      assertIsSortDirection(sortDirection);

      let projection;
      try {
        projection = tryGetProjection(schema, { includeResponseFields: [sortField] }, entityClass, Types);
      } catch (error) {
        throw new Error(createErrorMessageWithStatusCode('Invalid sort field: ' + sortField, 400));
      }

      const sortColumn = getSqlColumnFromProjection(projection);
      return sortColumn + ' ' + sortDirection;
    });

    return `ORDER BY ${sortBysStr} ${idFieldsSortBys ? ', ' + idFieldsSortBys : ''}`;
  }

  return idFieldsSortBys ? `ORDER BY ${idFieldsSortBys}` : '';
}
