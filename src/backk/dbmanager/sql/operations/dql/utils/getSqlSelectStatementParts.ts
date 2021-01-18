import AbstractSqlDbManager from "../../../../AbstractSqlDbManager";
import { PostQueryOperations } from "../../../../../types/postqueryoperations/PostQueryOperations";
import SqlExpression from "../../../expressions/SqlExpression";
import tryGetProjection from "../clauses/tryGetProjection";
import getJoinClause from "../clauses/getJoinClause";
import tryGetWhereClause from "../clauses/tryGetWhereClause";
import getFilterValues from "./getFilterValues";
import tryGetSortClause from "../clauses/tryGetOrderByClause";
import getRootPaginationClause from "../clauses/getRootPaginationClause";
import UserDefinedFilter from "../../../../../types/userdefinedfilters/UserDefinedFilter";

export default function getSqlSelectStatementParts<T>(
  dbManager: AbstractSqlDbManager,
  { sortBys, paginations, ...projection }: PostQueryOperations,
  EntityClass: new () => T,
  filters?: SqlExpression[] | UserDefinedFilter[],
  isInternalCall = false
) {
  const Types = dbManager.getTypes();
  const columns = tryGetProjection(dbManager, projection, EntityClass, Types, isInternalCall);
  const joinClauses = getJoinClause(dbManager.schema, projection, filters, EntityClass, Types);
  const filterValues = getFilterValues(filters);
  const rootWhereClause = tryGetWhereClause(dbManager, '', filters, EntityClass, Types);
  const rootSortClause = tryGetSortClause(dbManager, '', sortBys, EntityClass, Types);
  const rootPaginationClause = getRootPaginationClause(paginations);
  return { columns, joinClauses, rootWhereClause, filterValues, rootSortClause, rootPaginationClause };
}
