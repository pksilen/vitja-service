import { JSONPath } from "jsonpath-plus";
import AbstractSqlDbManager from "../../../AbstractSqlDbManager";
import getEntityById from "./getEntityById";
import createBackkErrorFromError from "../../../../errors/createBackkErrorFromError";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";
import { PromiseOfErrorOr } from "../../../../types/PromiseOfErrorOr";

export default async function getSubEntities<T extends object, U extends object>(
  dbManager: AbstractSqlDbManager,
  _id: string,
  subEntityPath: string,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations,
  responseMode?: 'first' | 'all'
): PromiseOfErrorOr<U[]> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass);

  try {
    const itemOrErrorResponse = await getEntityById(dbManager, _id, EntityClass, postQueryOperations);
    if ('errorMessage' in itemOrErrorResponse) {
      return itemOrErrorResponse;
    }

    const subItems: U[] = JSONPath({ json: itemOrErrorResponse, path: subEntityPath });
    return responseMode === 'first' ? [subItems[0]] : subItems;
  } catch (error) {
    return createBackkErrorFromError(error);
  }
}
