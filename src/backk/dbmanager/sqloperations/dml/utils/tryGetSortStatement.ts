import { SortBy } from '../../../../Backk';
import { assertIsColumnName, assertIsSortDirection } from '../../../../assert';
import tryGetProjection from "./tryGetProjection";
import getSqlColumnFromProjection from "./getSqlColumnFromProjection";

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
        projection = tryGetProjection(schema,{ includeResponseFields: [sortField] }, entityClass, Types);
      } catch (error) {
        throw new Error('Invalid sort field: ' + sortField);
      }

      const sortColumn = getSqlColumnFromProjection(projection);
      return sortColumn + ' ' + sortDirection;
    });

    sortStatement = `ORDER BY ${sortBysStr}`;
  }

  return sortStatement;
}
