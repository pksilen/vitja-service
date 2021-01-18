import assertIsNumber from '../../../../../assertions/assertIsNumber';
import Pagination from '../../../../../types/postqueryoperations/Pagination';

export default function getRootPaginationClause(paginations: Pagination[]) {
  let limitAndOffsetStatement = '';

  let rootPagination = paginations.find((pagination) => pagination.subEntityPath === '');
  if (!rootPagination) {
    rootPagination = paginations.find((pagination) => pagination.subEntityPath === '*');
  }

  if (rootPagination) {
    assertIsNumber('pageNumber', rootPagination.pageNumber);
    assertIsNumber('pageSize', rootPagination.pageSize);
    limitAndOffsetStatement = `LIMIT ${rootPagination.pageSize} OFFSET ${(rootPagination.pageNumber - 1) *
      rootPagination.pageSize}`;
  }

  return limitAndOffsetStatement;
}
