import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import getTypeMetadata from "../../../../metadata/getTypeMetadata";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import createErrorMessageWithStatusCode from "../../../../errors/createErrorMessageWithStatusCode";
import createErrorResponseFromErrorMessageAndStatusCode
  from "../../../../errors/createErrorResponseFromErrorMessageAndStatusCode";
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";

export default async function getEntityById<T>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  entityClass: new () => T,
  postQueryOperations?: PostQueryOperations,
  isInternalCall = false
): Promise<T | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  const Types = dbManager.getTypes();
  const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

  try {
    const { columns, joinClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      entityClass,
      Types,
      undefined,
      isInternalCall
    );

    const typeMetadata = getTypeMetadata(entityClass);
    const idFieldName = typeMetadata._id ? '_id' : 'id';
    const numericId = parseInt(_id, 10);
    if (isNaN(numericId)) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(createErrorMessageWithStatusCode(idFieldName + ': must be a numeric id', 400));
    }

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinClause} WHERE ${dbManager.schema}.${entityClass.name}.${idFieldName} = $1`,
      [numericId]
    );

    if (result.rows.length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(`Item with _id: ${_id} not found`, 404);
    }

    return transformRowsToObjects(result, entityClass, finalPostQueryOperations, Types)[0];
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
