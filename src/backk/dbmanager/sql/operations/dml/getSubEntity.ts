import { JSONPath } from "jsonpath-plus";
import getNotFoundErrorResponse from "../../../../errors/getNotFoundErrorResponse";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import getEntityById from "./getEntityById";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";

export default async function getSubEntity<T extends object, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntityPath: string,
  entityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<U | ErrorResponse> {
  try {
    const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, postQueryOperations);
    if ('errorMessage' in itemOrErrorResponse) {
      return itemOrErrorResponse;
    }

    const subItems = JSONPath({ json: itemOrErrorResponse, path: subEntityPath });

    if (subItems.length > 0) {
      return subItems[0];
    } else {
      return getNotFoundErrorResponse(
        'Item with _id: ' + _id + ', sub item from path ' + subEntityPath + ' not found'
      );
    }
  } catch (error) {
    return getErrorResponse(error);
  }
}
