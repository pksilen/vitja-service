import { JSONPath } from "jsonpath-plus";
import getNotFoundErrorResponse from "../../../../errors/getNotFoundErrorResponse";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import getEntityById from "./getEntityById";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";

export default async function getSubEntity<T extends object, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subItemPath: string,
  entityClass: new () => T,
  Types: object
): Promise<U | ErrorResponse> {
  try {
    const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, Types);
    if ('errorMessage' in itemOrErrorResponse) {
      return itemOrErrorResponse;
    }

    const subItems = JSONPath({ json: itemOrErrorResponse, path: subItemPath });

    if (subItems.length > 0) {
      return subItems[0];
    } else {
      return getNotFoundErrorResponse(
        'Item with _id: ' + _id + ', sub item from path ' + subItemPath + ' not found'
      );
    }
  } catch (error) {
    return getErrorResponse(error);
  }
}
