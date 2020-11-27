import { JSONPath } from 'jsonpath-plus';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from './getEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromErrorMessageAndStatusCode from "../../../../errors/createErrorResponseFromErrorMessageAndStatusCode";
import updateDbLocalTransactionCount from "./utils/updateDbLocalTransactionCount";

export default async function getSubEntities<T extends object, U>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntityPath: string,
  EntityClass: new () => T,
  postQueryOperations?: PostQueryOperations,
  responseMode?: 'first' | 'all'
): Promise<U | ErrorResponse> {
  updateDbLocalTransactionCount(dbManager);
  // noinspection AssignmentToFunctionParameterJS
  EntityClass = dbManager.getType(EntityClass.name);

  try {
    const itemOrErrorResponse = await getEntityById(dbManager, _id, EntityClass, postQueryOperations);
    if ('errorMessage' in itemOrErrorResponse) {
      return itemOrErrorResponse;
    }

    const subItems = JSONPath({ json: itemOrErrorResponse, path: subEntityPath });

    if (subItems.length > 0) {
      return responseMode === 'first' ? subItems[0] : subItems;
    } else {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Item with _id: ' + _id + ', sub item from path ' + subEntityPath + ' not found',
        404
      );
    }
  } catch (error) {
    return createErrorResponseFromError(error);
  }
}
