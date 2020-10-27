import shouldUseRandomInitializationVector from "../../../../crypt/shouldUseRandomInitializationVector";
import shouldEncryptValue from "../../../../crypt/shouldEncryptValue";
import encrypt from "../../../../crypt/encrypt";
import getNotFoundErrorResponse from "../../../../errors/getNotFoundErrorResponse";
import getInternalServerErrorResponse from "../../../../errors/getInternalServerErrorResponse";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import tryGetProjection from "./utils/tryGetProjection";
import tryGetSortStatement from "./utils/tryGetSortStatement";
import getJoinStatement from "./utils/getJoinStatement";
import getPagingStatement from "./utils/getPagingStatement";
import OptPostQueryOps from "../../../../types/OptPostQueryOps";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import transformRowsToObjects from "./utils/transformRowsToObjects";

export default async function getEntitiesBy<T>(
  dbManager: PostgreSqlDbManager,
  fieldName: string,
  fieldValue: T[keyof T],
  entityClass: new () => T,
  Types: object,
  postQueryOps?: OptPostQueryOps
): Promise<T[] | ErrorResponse> {
  try {
    const item = {
      [fieldName]: fieldValue
    };

    if (!shouldUseRandomInitializationVector(fieldName) && shouldEncryptValue(fieldName)) {
      (item as any)[fieldName] = encrypt(fieldValue as any, false);
    }

    const projection = {
      includeResponseFields: postQueryOps?.includeResponseFields,
      excludeResponseFields: postQueryOps?.excludeResponseFields
    };

    const sqlColumns = tryGetProjection(dbManager.schema, projection, entityClass, Types);
    const sortStatement = tryGetSortStatement(dbManager.schema, postQueryOps?.sortBys, entityClass, Types);
    const joinStatement = getJoinStatement(dbManager.schema, entityClass, Types);
    const pagingStatement = getPagingStatement(postQueryOps?.pageNumber, postQueryOps?.pageSize);

    const result = await dbManager.tryExecuteQuery(
      `SELECT ${sqlColumns} FROM ${dbManager.schema}.${entityClass.name} ${joinStatement} WHERE ${fieldName} = $1 ${sortStatement} ${pagingStatement}`,
      [(item as any)[fieldName]]
    );

    if (result.rows.length === 0) {
      return getNotFoundErrorResponse(`Item(s) with ${fieldName}: ${fieldValue} not found`);
    }

    return transformRowsToObjects(result, entityClass, projection, Types);
  } catch (error) {
    return getInternalServerErrorResponse(error);
  }
}
