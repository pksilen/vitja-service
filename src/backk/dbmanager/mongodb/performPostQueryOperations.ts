import { Cursor } from 'mongodb';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import getProjection from './getProjection';

export default function performPostQueryOperations<T>(
  cursor: Cursor<T>,
  postQueryOperations?: PostQueryOperations
) {
  cursor.project(getProjection(postQueryOperations ?? {}));

  if (postQueryOperations?.sortBys) {
    const sorting = postQueryOperations.sortBys.reduce(
      (accumulatedSortObj, { fieldName, sortDirection }) => ({
        ...accumulatedSortObj,
        [fieldName]: sortDirection === 'ASC' ? 1 : -1
      }),
      {}
    );

    cursor.sort(sorting);

    if (postQueryOperations?.pageNumber && postQueryOperations?.pageSize) {
      cursor
        .skip((postQueryOperations.pageNumber - 1) * postQueryOperations.pageSize)
        .limit(postQueryOperations.pageSize);
    }
  }
}
