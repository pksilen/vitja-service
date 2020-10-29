import SqlExpression from "../../expressions/SqlExpression";
import { types } from "pg";
import { pg } from "yesql";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import tryGetProjection from "./utils/tryGetProjection";
import tryGetSortStatement from "./utils/tryGetSortStatement";
import getPagingStatement from "./utils/getPagingStatement";
import tryGetWhereStatement from "./utils/tryGetWhereStatement";
import getFilterValues from "./utils/getFilterValues";
import getJoinStatement from "./utils/getJoinStatement";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./utils/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";

export default async function getEntities<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[],
  entityClass: new () => T,
  {  pageNumber, pageSize, sortBys, ...projection }: PostQueryOperations

): Promise<T[] | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    const columns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
    const whereStatement = tryGetWhereStatement(dbManager.schema, filters, entityClass, types);
    const sortStatement = tryGetSortStatement(dbManager.schema, sortBys, entityClass, Types);
    const filterValues = getFilterValues(filters);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(pageNumber, pageSize);

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(
        `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} ${whereStatement} ${sortStatement} ${pagingStatement}`
      )(filterValues)
    );

    return transformRowsToObjects(result, entityClass, projection, pageSize, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
