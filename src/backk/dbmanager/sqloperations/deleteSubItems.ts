import { ErrorResponse } from '../../Backk';
import { JSONPath } from 'jsonpath-plus';
import getConflictErrorResponse from '../../getConflictErrorResponse';
import { plainToClass } from 'class-transformer';
import forEachAsyncParallel from '../../forEachAsyncParallel';
import getInternalServerErrorResponse from '../../getInternalServerErrorResponse';
import PostgreSqlDbManager from '../PostgreSqlDbManager';
import getItemById from './getItemById';
import deleteItemById from './deleteItemById';

export default async function deleteSubItems<T extends { _id: string; id?: string }, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subItemsPath: string,
  entityClass: new () => T,
  Types: object,
  preCondition?: object | string
): Promise<void | ErrorResponse> {
  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    const itemOrErrorResponse = await getItemById(dbManager, _id, entityClass, Types);
    if ('errorMessage' in itemOrErrorResponse) {
      console.log(itemOrErrorResponse);
      return itemOrErrorResponse;
    }

    if (preCondition) {
      if (typeof preCondition === 'object') {
        const isPreConditionMatched = Object.entries(preCondition).reduce(
          (isPreconditionMatched, [path, value]) => {
            return isPreconditionMatched && JSONPath({ json: itemOrErrorResponse, path })[0] === value;
          },
          true
        );
        if (!isPreConditionMatched) {
          return getConflictErrorResponse(
            `Delete sub item precondition ${JSON.stringify(preCondition)} was not satisfied`
          );
        }
      }
    }

    const itemInstance = plainToClass(entityClass, itemOrErrorResponse);
    const subItems = JSONPath({ json: itemInstance, path: subItemsPath });
    await forEachAsyncParallel(subItems, async (subItem: any) => {
      const possibleErrorResponse = await deleteItemById(dbManager, subItem.id, subItem.constructor, Types);
      if (possibleErrorResponse) {
        throw new Error(possibleErrorResponse.errorMessage);
      }
    });

    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.commitTransaction();
    }
  } catch (error) {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.rollbackTransaction();
    }

    return getInternalServerErrorResponse(error);
  }
}
