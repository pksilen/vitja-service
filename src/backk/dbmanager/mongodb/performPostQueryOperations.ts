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

    if (postQueryOperations?.pageNumber && postQueryOperations?.pageSize) {
      cursor
        .skip((postQueryOperations.pageNumber - 1) * postQueryOperations.pageSize)
        .limit(postQueryOperations.pageSize);
    }
  }
}
