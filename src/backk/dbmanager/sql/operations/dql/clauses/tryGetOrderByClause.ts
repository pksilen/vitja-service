import tryGetProjection from './tryGetProjection';
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
  Types: object,
  tableAlias?: string
) {
  const sortBysForSubEntityPath = sortBys.filter(
    (sortBy) => sortBy.subEntityPath === subEntityPath || (subEntityPath === '' && !sortBy.subEntityPath)
  );

  const sortBysForAllSubEntityPaths = sortBys.filter((sortBy) => sortBy.subEntityPath === '*');

  const sortBysStr = [...sortBysForSubEntityPath, ...sortBysForAllSubEntityPaths]
    .map((sortBy) => {
      assertIsSortDirection(sortBy.sortDirection);

      let projection;
      try {
        projection = tryGetProjection(
          dbManager,
          {
            includeResponseFields: [subEntityPath ? subEntityPath + '.' + sortBy.fieldName : sortBy.fieldName]
          },
          EntityClass,
          Types
        );
      } catch (error) {
        if (sortBy.subEntityPath !== '*') {
          throw new Error(
            createErrorMessageWithStatusCode(
              'Invalid sort field: ' + sortBy.fieldName,
              HttpStatusCodes.BAD_REQUEST
            )
          );
        }
      }

      if (projection) {
        if (tableAlias) {
          return tableAlias.toLowerCase() + '.' + sortBy.fieldName + ' ' + sortBy.sortDirection;
        } else {
          return sortBy.fieldName + ' ' + sortBy.sortDirection;
        }
      }

      return undefined;
    })
    .filter((sortByStr) => sortByStr)
    .join(', ');

  if (tableAlias) {
    return sortBysStr;
  } else {
    return sortBysStr ? `ORDER BY ${sortBysStr}` : '';
  }
}
