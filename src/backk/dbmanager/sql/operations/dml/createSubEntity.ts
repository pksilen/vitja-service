import { JSONPath } from "jsonpath-plus";
import entityAnnotationContainer from "../../../../decorators/entity/entityAnnotationContainer";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";

export default async function createSubEntity<T extends { _id: string; id?: string }, U extends object>(
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

    const itemOrErrorResponse = await dbManager.getEntityById(_id, entityClass, Types);
    if ('errorMessage' in itemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(itemOrErrorResponse.errorMessage);
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

    const createdItemOrErrorResponse = await dbManager.createEntity(
      { ...newSubItem, [parentIdFieldName]: parentIdValue, id: (maxSubItemId + 1).toString() } as any,
      subItemEntityClass,
      Types,
      undefined,
      false
    );

    if ('errorMessage' in createdItemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(createdItemOrErrorResponse.errorMessage);
    }

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }

    return await dbManager.getEntityById(_id, entityClass, Types);
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return getErrorResponse(error);
  }
}
