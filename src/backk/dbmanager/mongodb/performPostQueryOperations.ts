import { AggregationCursor, Cursor } from 'mongodb';
import { PostQueryOperations } from '../../types/postqueryoperations/PostQueryOperations';
import getProjection from './getProjection';
import getRootProjection from "./getRootProjection";

export default function performPostQueryOperations<T>(
  cursor: Cursor<T> | AggregationCursor<T>,
  postQueryOperations: PostQueryOperations | undefined,
  EntityClass: new() => T,
  Types: any
) {
  if (postQueryOperations) {
    const projection = getProjection(postQueryOperations);
    const rootProjection = getRootProjection(projection, EntityClass, Types)
    if (Object.keys(rootProjection).length > 0) {
      cursor.project(rootProjection);
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
