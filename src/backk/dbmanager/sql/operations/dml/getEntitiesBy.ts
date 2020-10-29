import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import tryGetProjection from "./utils/tryGetProjection";
import tryGetSortStatement from "./utils/tryGetSortStatement";
import getJoinStatement from "./utils/getJoinStatement";
import getPagingStatement from "./utils/getPagingStatement";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./utils/transformRowsToObjects";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import createErrorResponseFromErrorMessageAndStatusCode from "../../../../errors/createErrorResponseFromErrorMessageAndStatusCode";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";

export default async function getEntitiesBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  { pageNumber, pageSize, sortBys, ...projection }: PostQueryOperations
): Promise<T[] | ErrorResponse> {
  try {
    const Types = dbManager.getTypes();
    const item = {
      [fieldName]: fieldValue
    };

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    const sqlColumns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
    const sortStatement = tryGetSortStatement(dbManager.schema, sortBys, entityClass, Types);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(pageNumber, pageSize);

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1 ${sortStatement} ${pagingStatement}`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return createErrorResponseFromErrorMessageAndStatusCode(`Item(s) with ${fieldName}: ${fieldValue} not found`, 404);
    }

    return transformRowsToObjects(result, entityClass, projection, pageSize, Types);
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
