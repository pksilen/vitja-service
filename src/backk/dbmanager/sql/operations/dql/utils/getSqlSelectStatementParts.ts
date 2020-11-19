import PostgreSqlDbManager from '../../../../PostgreSqlDbManager';
import { PostQueryOperations } from '../../../../../types/postqueryoperations/PostQueryOperations';
import SqlExpression from '../../../expressions/SqlExpression';
import tryGetProjection from '../clauses/tryGetProjection';
import getJoinClause from '../clauses/getJoinClause';
import tryGetWhereClause from '../clauses/tryGetWhereClause';
import getFilterValues from './getFilterValues';
import tryGetSortClause from '../clauses/tryGetOrderByClause';
import getPaginationClause from '../clauses/getPaginationClause';
import UserDefinedFilter from '../../../../../types/userdefinedfilters/UserDefinedFilter';
import tryGetWindowClausesForSubPaginations from '../clauses/tryGetWindowClausesForSubPaginations';

export default function getSqlSelectStatementParts<T>(
  dbManager: PostgreSqlDbManager,
  { pageNumber, pageSize, sortBys, subPaginations, ...projection }: PostQueryOperations,
  entityClass: new () => T,
  Types: object,
  filters?: Partial<T> | SqlExpression[] | UserDefinedFilter[],
  isInternalCall = false
) {
  const projectionColumns = tryGetProjection(dbManager.schema, projection, entityClass, Types, isInternalCall);
  const windowClauses = tryGetWindowClausesForSubPaginations(
    dbManager.schema,
    subPaginations,
    sortBys,
    entityClass,
    Types
  );
  const columns = projectionColumns + (windowClauses.length > 0 ? ', ' + windowClauses.join(', ') : '');
  const joinClause = getJoinClause(dbManager.schema, projection, entityClass, Types);

  let whereClause = '';
  let filterValues = {};
  if (filters) {
    whereClause = tryGetWhereClause(dbManager.schema, filters, subPaginations, entityClass, Types);
    filterValues = getFilterValues(filters);
  }

  const sortClause = tryGetSortClause(dbManager.schema, sortBys, subPaginations, entityClass, Types);
  const pagingClause = getPaginationClause(pageNumber, pageSize);
  return { columns, joinClause, whereClause, filterValues, sortClause, pagingClause };
}
