import SubPagination from '../../../../../types/postqueryoperations/SubPagination';

export default function createSubPaginationSelectStatement(
  selectStatement: string,
  subPaginations: SubPagination[] | undefined
) {
  if (subPaginations && subPaginations.length > 0) {
    const rankFilters = subPaginations.map(({ fieldName, pageNumber, pageSize }) => {
      const minRank = (pageNumber - 1) * pageSize + 1;
      const maxRank = minRank + pageSize;
      const rankFieldName = fieldName.replace('.', '_') + '_rank';
      return `${rankFieldName} >= ${minRank} AND ${rankFieldName} < ${maxRank}`;
    });

    const outerWhereClause = 'WHERE ' + rankFilters.join(' AND ');
    return 'SELECT * FROM (' + selectStatement + ') as tmp ' + outerWhereClause;
  }

  return selectStatement;
}
