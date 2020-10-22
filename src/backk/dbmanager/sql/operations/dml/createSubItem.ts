import { JSONPath } from 'jsonpath-plus';
import entityAnnotationContainer from '../../../../decorators/entity/entityAnnotationContainer';
import getInternalServerErrorResponse from '../../../../errors/getInternalServerErrorResponse';
import PostgreSqlDbManager from '../../../PostgreSqlDbManager';
import { ErrorResponse } from "../../../../types/ErrorResponse";

export default async function createSubItem<T extends { _id: string; id?: string }, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subItemsPath: string,
  newSubItem: Omit<U, 'id'>,
  entityClass: new () => T,
  subItemEntityClass: new () => U,
  Types: object
): Promise<T | ErrorResponse> {
  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    const itemOrErrorResponse = await dbManager.getItemById(_id, entityClass, Types);
    if ('errorMessage' in itemOrErrorResponse) {
      console.log(itemOrErrorResponse);
      return itemOrErrorResponse;
    }

    const parentIdValue = JSONPath({ json: itemOrErrorResponse, path: '$._id' })[0];
    const parentIdFieldName = entityAnnotationContainer.getAdditionIdPropertyName(subItemEntityClass.name);
    const maxSubItemId = JSONPath({ json: itemOrErrorResponse, path: subItemsPath }).reduce(
      (maxSubItemId: number, subItem: any) => {
        const subItemId = parseInt(subItem.id);
        return subItemId > maxSubItemId ? subItemId : maxSubItemId;
      },
      -1
    );

    await dbManager.createItem(
      { ...newSubItem, [parentIdFieldName]: parentIdValue, id: (maxSubItemId + 1).toString() } as any,
      subItemEntityClass,
      Types
    );

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }

    return dbManager.getItemById(_id, entityClass, Types);
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }

    return getInternalServerErrorResponse(error);
  }
}
