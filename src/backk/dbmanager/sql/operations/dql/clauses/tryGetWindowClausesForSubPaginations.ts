import SubPagination from '../../../../../types/postqueryoperations/SubPagination';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import tryGetSqlColumnForFieldName from '../utils/columns/getSqlColumnForFieldName';
import AbstractSqlDbManager from "../../../../AbstractSqlDbManager";

export default function tryGetWindowClausesForSubPaginations(
  dbManager: AbstractSqlDbManager,
  subPaginations: SubPagination[] | undefined,
  sortBys: SortBy[],
  entityClass: Function,
  Types: object
): string[] {
  const windowClauses: string[] = [];

  subPaginations?.forEach(({ fieldName }) => {
    const idFieldName = fieldName + '.id';
    const partitionSqlColumn = tryGetSqlColumnForFieldName(idFieldName, dbManager, entityClass, Types);

    const sortBy = sortBys.find(
      (sortBy) => sortBy.fieldName.slice(0, sortBy.fieldName.lastIndexOf('.')) === fieldName
    );

    const sortBySqlColumn = tryGetSqlColumnForFieldName(
      sortBy?.fieldName ?? idFieldName,
      dbManager,
      entityClass,
      Types
    );

    windowClauses.push(
      'rank() OVER (PARTITION BY ' +
        partitionSqlColumn +
        ' ORDER BY ' +
        sortBySqlColumn +
        ' ' +
        sortBy?.sortDirection ?? 'ASC' + ') AS ' + fieldName.replace('.', '_') + '_rank'
    );
  });

  return windowClauses;
}
