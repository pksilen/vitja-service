import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import getNotFoundErrorResponse from "../../../../errors/getNotFoundErrorResponse";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import tryGetProjection from "./utils/tryGetProjection";
import getJoinStatement from "./utils/getJoinStatement";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";
import transformRowsToObjects from "./utils/transformRowsToObjects";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";

export default async function getEntityBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  try {
    const Types = dbManager.getTypes();
    const item = {
      [fieldName]: fieldValue
    };

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    const sqlColumns = tryGetProjection(
      dbManager.schema,
      postQueryOperations ?? {},
      entityClass,
      Types
    );

    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item with ${fieldName}: ${fieldValue} not found`);
    }

    return transformRowsToObjects(result, entityClass, {}, 1, Types)[0];
  } catch (error) {
    return getErrorResponse(error);
  }
}
