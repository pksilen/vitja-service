import { JSONPath } from 'jsonpath-plus';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import getEntityById from './getEntityById';
import { ErrorResponse } from '../../../../types/ErrorResponse';
import createErrorResponseFromError from '../../../../errors/createErrorResponseFromError';
import { PostQueryOperations } from '../../../../types/postqueryoperations/PostQueryOperations';
import createErrorResponseFromErrorMessageAndStatusCode from "../../../../errors/createErrorResponseFromErrorMessageAndStatusCode";
import updateDbTransactionCount from "./utils/updateDbTransactionCount";

export default async function getSubEntity<T extends object, U>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntityPath: string,
  entityClass: new () => T,
  postQueryOperations?: PostQueryOperations
): Promise<U | ErrorResponse> {
  updateDbTransactionCount(dbManager);

  try {
    const itemOrErrorResponse = await getEntityById(dbManager, _id, entityClass, postQueryOperations);
    if ('errorMessage' in itemOrErrorResponse) {
      return itemOrErrorResponse;
    }

    const subItems = JSONPath({ json: itemOrErrorResponse, path: subEntityPath });

    if (subItems.length > 0) {
      return subItems[0];
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
