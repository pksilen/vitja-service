import { JSONPath } from "jsonpath-plus";
import entityAnnotationContainer from "../../../../decorators/entity/entityAnnotationContainer";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";
import { Entity } from "../../../../types/Entity";
import { PostQueryOperations } from "../../../../types/postqueryoperations/PostQueryOperations";

export default async function createSubEntity<T extends Entity, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subEntitiesPath: string,
  newSubEntity: Omit<U, 'id'>,
  entityClass: new () => T,
  subEntityClass: new () => U,
  postQueryOperations?: PostQueryOperations
): Promise<T | ErrorResponse> {
  const Types = dbManager.getTypes();

  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    const itemOrErrorResponse = await dbManager.getEntityById(_id, entityClass, postQueryOperations);
    if ('errorMessage' in itemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(itemOrErrorResponse.errorMessage);
    }

    const parentIdValue = JSONPath({ json: itemOrErrorResponse, path: '$._id' })[0];
    const parentIdFieldName = entityAnnotationContainer.getAdditionIdPropertyName(subEntityClass.name);
    const maxSubItemId = JSONPath({ json: itemOrErrorResponse, path: subEntitiesPath }).reduce(
      (maxSubItemId: number, subItem: any) => {
        const subItemId = parseInt(subItem.id);
        return subItemId > maxSubItemId ? subItemId : maxSubItemId;
      },
      -1
    );

    const createdItemOrErrorResponse = await dbManager.createEntity(
      { ...newSubEntity, [parentIdFieldName]: parentIdValue, id: (maxSubItemId + 1).toString() } as any,
      subEntityClass,
      undefined,
      postQueryOperations,
      false
    );

    if ('errorMessage' in createdItemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(createdItemOrErrorResponse.errorMessage);
    }

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }

    return await dbManager.getEntityById(_id, entityClass, postQueryOperations);
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }
    return getErrorResponse(error);
  }
}
