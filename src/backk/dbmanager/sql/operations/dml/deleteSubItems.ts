import { JSONPath } from "jsonpath-plus";
import { plainToClass } from "class-transformer";
import forEachAsyncParallel from "../../../../utils/forEachAsyncParallel";
import PostgreSqlDbManager from "../../../PostgreSqlDbManager";
import getItemById from "./getItemById";
import deleteItemById from "./deleteItemById";
import { ErrorResponse } from "../../../../types/ErrorResponse";
import getErrorResponse from "../../../../errors/getErrorResponse";
import executePreHooks from "../../../hooks/executePreHooks";
import { PreHook } from "../../../AbstractDbManager";

export default async function deleteSubItems<T extends { _id: string; id?: string }, U extends object>(
  dbManager: PostgreSqlDbManager,
  _id: string,
  subItemsPath: string,
  entityClass: new () => T,
  Types: object,
  preHooks?: PreHook | PreHook[]
): Promise<void | ErrorResponse> {
  try {
    if (!dbManager.getClsNamespace()?.get('globalTransaction')) {
      await dbManager.beginTransaction();
    }

    const itemOrErrorResponse = await getItemById(dbManager, _id, entityClass, Types, true);
    if ('errorMessage' in itemOrErrorResponse) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error(itemOrErrorResponse.errorMessage);
    }

    if (preHooks) {
      await executePreHooks(preHooks, itemOrErrorResponse);
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
    return getErrorResponse(error);
  }
}
