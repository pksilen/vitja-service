import { ErrorResponse } from '../../../Backk';
import { JSONPath } from 'jsonpath-plus';
import getNotFoundErrorResponse from '../../../getNotFoundErrorResponse';
import getInternalServerErrorResponse from '../../../getInternalServerErrorResponse';
import PostgreSqlDbManager from '../../PostgreSqlDbManager';
import getItemById from './getItemById';

export default async function getSubItem<T extends object, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subItemPath: string,
  entityClass: new () => T,
  Types: object
): Promise<U | ErrorResponse> {
  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    const itemOrErrorResponse = await getItemById(dbManager, _id, entityClass, Types);
    if ('errorMessage' in itemOrErrorResponse) {
      console.log(itemOrErrorResponse);
      return itemOrErrorResponse;
    }

    const subItems = JSONPath({ json: itemOrErrorResponse, path: subItemPath });

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }

    if (subItems.length > 0) {
      return subItems[0];
    } else {
      return getNotFoundErrorResponse(
        'Item with _id: ' + _id + ', sub item from path ' + subItemPath + ' not found'
      );
    }
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }

    return getInternalServerErrorResponse(error);
  }
}
