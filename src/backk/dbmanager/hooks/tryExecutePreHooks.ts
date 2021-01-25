import forEachAsyncSequential from "../../utils/forEachAsyncSequential";
import { JSONPath } from "jsonpath-plus";
import { ErrorResponse } from "../../types/ErrorResponse";
import { PreHook } from "./PreHook";
import createErrorMessageWithStatusCode from "../../errors/createErrorMessageWithStatusCode";
import isErrorResponse from "../../errors/isErrorResponse";

export default async function tryExecutePreHooks<T extends object>(
  preHooks?: PreHook | PreHook[],
  itemOrErrorResponse?: T | ErrorResponse
) {
  if (
    typeof itemOrErrorResponse === 'object' &&
    'errorMessage' in itemOrErrorResponse &&
    isErrorResponse(itemOrErrorResponse)
  ) {
    throw itemOrErrorResponse;
  }

  if (!preHooks) {
    return;
  }

  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook: PreHook) => {
    let items: any[] | undefined;
    if (itemOrErrorResponse !== undefined) {
      items = JSONPath({ json: itemOrErrorResponse, path: preHook.currentEntityJsonPath ?? '$' });
    }

    const hookCallResult = await preHook.hookFunc(items);

    if (hookCallResult !== undefined) {
      if (typeof hookCallResult === 'object' && '_id' in hookCallResult) {
        return;
      }
      if (
        typeof hookCallResult !== 'boolean' &&
        'errorMessage' in hookCallResult
      ) {
        throw hookCallResult;
      } else if (hookCallResult === false) {
        if (process.env.NODE_ENV === 'development' && preHook.disregardInTests) {
          return;
        }
        let errorMessage = 'Unspecified pre-hook error';
        if (preHook.error) {
          errorMessage = 'Error code ' + preHook.error.errorCode + ':' + preHook.error.errorMessage;
        }
        throw new Error(createErrorMessageWithStatusCode(errorMessage, preHook.error?.statusCode ?? 400));
      } else if (
        process.env.NODE_ENV === 'development' &&
        hookCallResult === true &&
        preHook.disregardInTests
      ) {
        throw new Error('Invalid hook result (=true) when disregardInTest is true');
      }
    }
  });
}
