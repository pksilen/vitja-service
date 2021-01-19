import { AggregationCursor, Cursor } from 'mongodb';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import getProjection from './getProjection';

export default function performPostQueryOperations<T>(
  cursor: Cursor<T> | AggregationCursor<T>,
  postQueryOperations?: PostQueryOperations
) {
  if (postQueryOperations) {
    const projection = getProjection(postQueryOperations);
    if (Object.keys(projection).length > 0) {
      cursor.project(projection);
    }
  }

  if (postQueryOperations?.sortBys) {
    const sorting = postQueryOperations.sortBys.reduce(
      (accumulatedSortObj, { fieldName, sortDirection }) => ({
        ...accumulatedSortObj,
        [fieldName]: sortDirection === 'ASC' ? 1 : -1
      }),
      {}
    );

    cursor.sort(sorting);

    let rootPagination = postQueryOperations?.paginations.find(pagination => pagination.subEntityPath === '');
    if (!rootPagination) {
      rootPagination = postQueryOperations?.paginations.find(pagination => pagination.subEntityPath === '*');
    }

    if (rootPagination) {
      cursor
        .skip((rootPagination.pageNumber - 1) * rootPagination.pageSize)
        .limit(rootPagination.pageSize);
    }
  }
}
