import { JSONPath } from "jsonpath-plus";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import getEntityById from "./getEntityById";
import { BackkError } from "../../../../types/BackkError";
import createErrorResponseFromError from "../../../../errors/createErrorResponseFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";

export default async function getSubEntities<T extends object, U>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  subEntityPath: string,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations,
  responseMode?: 'first' | 'all'
): Promise<[U, BackkError | null]> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const itemOrErrorResponse = await getEntityById(dbManager, _id, EntityClass, postQueryOperations);
    if ('errorMessage' in itemOrErrorResponse) {
      return itemOrErrorResponse;
    }

    const subItems = JSONPath({ json: itemOrErrorResponse, path: subEntityPath });
    return responseMode === 'first' ? subItems[0] : subItems;
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
