import PostgreSqlDbManager from "../../../../PostgreSqlDbManager";
import { PostQueryOperations } from "../../../../../types/postqueryoperations/PostQueryOperations";
import SqlExpression from "../../../expressions/SqlExpression";
import tryGetProjection from "../clauses/tryGetProjection";
import getJoinClause from "../clauses/getJoinClause";
import tryGetWhereClause from "../clauses/tryGetWhereClause";
import getFilterValues from "./getFilterValues";
import tryGetSortClause from "../clauses/tryGetOrderByClause";
import getPagingClause from "../clauses/getPagingClause";

export default function getSqlSelectStatementParts<T>(
  dbManager: PostgreSqlDbManager,
  { pageNumber, pageSize, sortBys, ...projection }: PostQueryOperations,
  entityClass: new () => T,
  Types: object,
  filters?: Partial<T> | SqlExpression[],
  isInternalCall = false
) {
  const columns = tryGetProjection(dbManager.schema, projection, entityClass, Types, isInternalCall);
  const joinClause = getJoinClause(dbManager.schema, projection, entityClass, Types);

  let whereClause = '';
  let filterValues = {};
  if (filters) {
    whereClause = tryGetWhereClause(dbManager.schema, filters, entityClass, Types);
    filterValues = getFilterValues(filters);
  }

  const sortClause = tryGetSortClause(dbManager.schema, sortBys, entityClass, Types);
  const pagingClause = getPagingClause(pageNumber, pageSize);
  return { columns, joinClause, whereClause, filterValues, sortClause, pagingClause };
}
