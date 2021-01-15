import SubPagination from '../../../../../types/postqueryoperations/SubPagination';
import SortBy from '../../../../../types/postqueryoperations/SortBy';
import tryGetSqlColumnForFieldName from '../utils/columns/getSqlColumnForFieldName';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';

export default function tryGetWindowClausesForSubPaginations(
  dbManager: AbstractSqlDbManager,
  subPaginations: SubPagination[] | undefined,
  sortBys: SortBy[],
  EntityClass: Function,
  Types: object
): string[] {
  const windowClauses: string[] = [];

  subPaginations?.forEach(({ fieldName }) => {
    let idFieldName = fieldName + '.id';
    let partitionBySqlColumn;

    try {
      partitionBySqlColumn = tryGetSqlColumnForFieldName(idFieldName, dbManager, EntityClass, Types);
    } catch (error) {
      // No operation
    }

    if (!partitionBySqlColumn) {
      idFieldName = fieldName + '._id';
      partitionBySqlColumn = tryGetSqlColumnForFieldName(idFieldName, dbManager, EntityClass, Types);
    }

    const sortBy = sortBys.find(
      (sortBy) => sortBy.fieldName.slice(0, sortBy.fieldName.lastIndexOf('.')) === fieldName
    );

    const sortBySqlColumn = tryGetSqlColumnForFieldName(
      sortBy?.fieldName ?? idFieldName,
      dbManager,
      EntityClass,
      Types
    );

    windowClauses.push(
      'rank() OVER (PARTITION BY ' +
        partitionBySqlColumn +
        ' ORDER BY ' +
        sortBySqlColumn +
        ' ' +
        (sortBy?.sortDirection ?? 'ASC') +
        ') AS ' +
        fieldName.replace('.', '_') +
        '_rank'
    );
  });

  return windowClauses;
}
