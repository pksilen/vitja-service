import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import transformRowsToObjects from "./transformresults/transformRowsToObjects";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import createErrorResponseFromErrorMessageAndStatusCode
  from "../../../../errors/createErrorResponseFromErrorMessageAndStatusCode";
import DefaultPostQueryOperations from "../../../../types/postqueryoperations/DefaultPostQueryOperations";
import getSqlSelectStatementParts from "./utils/getSqlSelectStatementParts";
import updateDbTransactionCount from "./utils/updateDbTransactionCount";

export default async function getEntityBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  updateDbTransactionCount(dbManager);
  const Types = dbManager.getTypes();
  const item = {
    [fieldName]: fieldValue
  };
  const finalPostQueryOperations = postQueryOperations ?? new DefaultPostQueryOperations();

  try {
    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    const { columns, joinClause } = getSqlSelectStatementParts(
      dbManager,
      finalPostQueryOperations,
      entityClass,
      Types
    );

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${columns} FROM ${dbManager.schema}.${entityClass.name} ${joinClause} WHERE ${fieldName} = $1`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        `Item with ${fieldName}: ${fieldValue} not found`,
        404
      );
    }

    return transformRowsToObjects(result, entityClass, finalPostQueryOperations, Types)[0];
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
