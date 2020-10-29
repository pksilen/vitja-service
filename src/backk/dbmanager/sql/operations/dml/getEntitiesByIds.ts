import { types } from "pg";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import tryGetProjection from "./utils/tryGetProjection";
import tryGetSortStatement from "./utils/tryGetSortStatement";
import getJoinStatement from "./utils/getJoinStatement";
import getPagingStatement from "./utils/getPagingStatement";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./utils/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import createErrorMessageWithStatusCode from "../../../../errors/createErrorMessageWithStatusCode";
import createErrorResponseFromErrorMessageAndStatusCode from "../../../../errors/createErrorResponseFromErrorMessageAndStatusCode";

export default async function getEntitiesByIds<T>(
  dbManager: PostgreSqlDbManager,
  _ids: string[],
  entityClass: new () => T,
  { pageNumber, pageSize, sortBys, ...projection }: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  try {
    const Types = dbManager.getTypes();
    const sqlColumns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
    const sortStatement = tryGetSortStatement(dbManager.schema, sortBys, entityClass, types);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(pageNumber, pageSize);
    const numericIds = _ids.map((id) => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        throw new Error(createErrorMessageWithStatusCode('All ids must be a numeric ids', 400));
      }
      return numericId;
    });
    const idPlaceholders = _ids.map((_, index) => `$${index + 1}`).join(', ');

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE _id IN (${idPlaceholders}) ${sortStatement} ${pagingStatement}`,
      numericIds
    );

    if (result.rows.length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(`Item with _ids: ${_ids} not found`, 404);
    }

    return transformRowsToObjects(result, entityClass, projection, pageSize, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
