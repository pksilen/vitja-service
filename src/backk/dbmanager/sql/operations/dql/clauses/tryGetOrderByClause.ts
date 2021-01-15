import _ from 'lodash';
import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from '../utils/columns/getSqlColumnFromProjection';
import assertIsSortDirection from '../../../../../assertions/assertIsSortDirection';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import getFieldsForEntity from '../utils/columns/getFieldsForEntity';
import createErrorMessageWithStatusCode from '../../../../../errors/createErrorMessageWithStatusCode';
import SubPagination from '../../../../../types/postqueryoperations/SubPagination';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';

export default function tryGetOrderByClause<T>(
  dbManager: AbstractSqlDbManager,
  sortBys: SortBy[] | undefined,
  subPaginations: SubPagination[] | undefined,
  entityClass: new () => T,
  Types: object
) {
  const fields: string[] = [];
  getFieldsForEntity(dbManager, fields, entityClass, Types, {}, '', true);

  const idFields = fields.filter(
    (field) =>
      (field.endsWith('.id') || field.endsWith('._id')) &&
      !sortBys?.find(({ fieldName }) => field !== fieldName) &&
      !subPaginations?.find(({ fieldName }) => field.slice(0, -3) === fieldName)
  );

  const sortedIdFields = _.sortBy(idFields, (field) => field.length);
  const idFieldsSortBysStr = sortedIdFields.map((sortedIdField) => sortedIdField + ' ASC').join(', ');

  const rankSortFields = subPaginations?.map(({ fieldName }) => fieldName.replace('.', '_') + '_rank ASC');
  const rankSortBysStr = rankSortFields?.join(', ');

  const sortBysStr = sortBys?.map(({ fieldName, sortDirection }) => {
    assertIsSortDirection(sortDirection);

    let projection;
    try {
      projection = tryGetProjection(dbManager, { includeResponseFields: [fieldName] }, entityClass, Types);
    } catch (error) {
      throw new Error(createErrorMessageWithStatusCode('Invalid sort field: ' + fieldName, 400));
    }

    const sortColumn = getSqlColumnFromProjection(projection);
    return sortColumn + ' ' + sortDirection;
  }).join(', ');

  const allSortBysStr = [sortBysStr, rankSortBysStr, idFieldsSortBysStr].filter(str => str).join(', ');
  return allSortBysStr ? `ORDER BY ${allSortBysStr}` : '';
}
