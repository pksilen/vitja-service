import SqlExpression from "../../expressions/SqlExpression";
import { pg } from "yesql";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";

export default async function getEntities<T>(
  dbManager: PostgreSqlDbManager,
  filters: Partial<T> | SqlExpression[],
  entityClass: new () => T,
  postQueryOperations: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    const {
      columns,
      joinClause,
      whereClause,
      filterValues,
      sortClause,
      pagingClause
    } = getSqlSelectStatementParts(dbManager, postQueryOperations, entityClass, Types, filters);

    const result = await dbManager.tryExecuteQueryWithConfig(
      pg(
        `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinClause} ${whereClause} ${sortClause} ${pagingClause}`
      )(filterValues)
    );

    return transformRowsToObjects(result, entityClass, postQueryOperations, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
