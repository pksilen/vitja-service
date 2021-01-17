import AbstractSqlDbManager from "../../../../AbstractSqlDbManager";
import { PostQueryOperations } from "../../../../../types/postqueryoperations/PostQueryOperations";
import SqlExpression from "../../../expressions/SqlExpression";
import tryGetProjection from "../clauses/tryGetProjection";
import getJoinClause from "../clauses/getJoinClause";
import tryGetWhereClause from "../clauses/tryGetWhereClause";
import getFilterValues from "./getFilterValues";
import tryGetSortClause from "../clauses/tryGetOrderByClause";
import getPaginationClause from "../clauses/getPaginationClause";
import UserDefinedFilter from "../../../../../types/userdefinedfilters/UserDefinedFilter";

export default function getSqlSelectStatementParts<T>(
  dbManager: AbstractSqlDbManager,
  { pageNumber, pageSize, sortBys, subPaginations, ...projection }: PostQueryOperations,
  EntityClass: new () => T,
  filters?: Partial<T> | SqlExpression[] | UserDefinedFilter[],
  isInternalCall = false,
  useRootEntity = false
) {
  const Types = dbManager.getTypes();
  const columns = tryGetProjection(dbManager, projection, EntityClass, Types, isInternalCall, useRootEntity);
  const joinClauses = getJoinClause(dbManager.schema, projection, EntityClass, Types);

  let rootWhereClause = '';
  let filterValues = {};

  if (filters) {
    rootWhereClause = tryGetWhereClause(dbManager, filters, subPaginations, EntityClass, Types);
    filterValues = getFilterValues(filters);
  }

  const rootSortClause = tryGetSortClause(dbManager, sortBys, subPaginations, EntityClass, Types);
  const rootPaginationClause = getPaginationClause(pageNumber, pageSize);
  return { columns, joinClauses, rootWhereClause, filterValues, rootSortClause, rootPaginationClause };
}
