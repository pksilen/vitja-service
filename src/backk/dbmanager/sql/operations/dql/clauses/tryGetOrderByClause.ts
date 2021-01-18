import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from '../utils/columns/getSqlColumnFromProjection';
import assertIsSortDirection from '../../../../../assertions/assertIsSortDirection';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import createErrorMessageWithStatusCode from '../../../../../errors/createErrorMessageWithStatusCode';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';
import { HttpStatusCodes } from '../../../../../constants/constants';

export default function tryGetOrderByClause<T>(
  dbManager: AbstractSqlDbManager,
  subEntityPath: string,
  sortBys: SortBy[],
  EntityClass: new () => T,
  Types: object
) {
  const sortBysForSubEntityPath = sortBys.filter((sortBy) => sortBy.subEntityPath === subEntityPath);
  const sortBysForAllSubEntityPaths = sortBys.filter((sortBy) => sortBy.subEntityPath === '*');

  const sortBysStr = [...sortBysForSubEntityPath, ...sortBysForAllSubEntityPaths]
    .map(({ subEntityPath, fieldName, sortDirection }) => {
      assertIsSortDirection(sortDirection);

      let projection;
      try {
        projection = tryGetProjection(
          dbManager,
          { includeResponseFields: [subEntityPath + '.' + fieldName] },
          EntityClass,
          Types
        );
      } catch (error) {
        if (subEntityPath !== '*') {
          throw new Error(
            createErrorMessageWithStatusCode('Invalid sort field: ' + fieldName, HttpStatusCodes.BAD_REQUEST)
          );
        }
      }

      if (projection) {
        const sortColumn = getSqlColumnFromProjection(projection);
        return sortColumn + ' ' + sortDirection;
      }

      return undefined;
    })
    .filter((sortByStr) => sortByStr)
    .join(', ');

  return sortBysStr ? `ORDER BY ${sortBysStr}` : '';
}
