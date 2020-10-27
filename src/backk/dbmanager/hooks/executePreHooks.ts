import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import { getBadRequestErrorMessage } from '../../errors/getBadRequestErrorResponse';
import { JSONPath } from 'jsonpath-plus';
import { ErrorResponse } from '../../types/ErrorResponse';
import { PreHook } from "./PreHook";

export default async function executePreHooks<T extends object>(
  preHooks: PreHook | PreHook[],
  itemOrErrorResponse?: T | ErrorResponse
) {
  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook: PreHook) => {
    if (typeof itemOrErrorResponse === 'object' && 'errorMessage' in itemOrErrorResponse) {
      throw new Error(itemOrErrorResponse.errorMessage);
    }

    let items: any[] | undefined;
    if (preHook.jsonPath && itemOrErrorResponse !== undefined) {
      items = JSONPath({ json: itemOrErrorResponse, path: preHook.jsonPath });
    }
    const hookCallResult = await preHook.hookFunc(items && items.length === 1 ? items[0] : items);
    if (hookCallResult !== undefined) {
      if (typeof hookCallResult !== 'boolean' && 'errorMessage' in hookCallResult) {
        throw new Error(hookCallResult.errorMessage);
      } else if (hookCallResult === false) {
        throw new Error(getBadRequestErrorMessage(preHook.errorMessage ?? 'Undefined pre-hook error'));
      }
    }
  });
}
