import tryGetProjection from './tryGetProjection';
import getSqlColumnFromProjection from './getSqlColumnFromProjection';
import assertIsColumnName from '../../../../../assertions/assertIsColumnName';
import assertIsSortDirection from '../../../../../assertions/assertIsSortDirection';
import SortBy from "../../../../../types/postqueryoperations/SortBy";

export default function tryGetSortStatement<T>(
  schema: string,
  sortBys: SortBy[] | undefined,
  entityClass: { new (): T },
  Types: object
) {
  let sortStatement = '';

  if (sortBys) {
    const sortBysStr = sortBys.map(({ sortField, sortDirection }) => {
      assertIsColumnName('sortBy', sortField);
      assertIsSortDirection(sortDirection);

      let projection;
      try {
        projection = tryGetProjection(schema, { includeResponseFields: [sortField] }, entityClass, Types);
      } catch (error) {
        throw new Error('400:Invalid sort field: ' + sortField);
      }

      const sortColumn = getSqlColumnFromProjection(projection);
      return sortColumn + ' ' + sortDirection;
    });

    sortStatement = `ORDER BY ${sortBysStr}`;
  }

  return sortStatement;
}
