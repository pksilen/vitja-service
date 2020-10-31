import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import { JSONPath } from 'jsonpath-plus';
import { ErrorResponse } from '../../types/ErrorResponse';
import { PreHook } from './PreHook';
import createErrorMessageWithStatusCode from '../../errors/createErrorMessageWithStatusCode';

export default async function tryExecutePreHooks<T extends object>(
  preHooks: PreHook | PreHook[],
  itemOrErrorResponse?: T | ErrorResponse
) {
  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook: PreHook) => {
    if (typeof itemOrErrorResponse === 'object' && 'errorMessage' in itemOrErrorResponse) {
      throw new Error(itemOrErrorResponse.errorMessage);
    }

    let items: any[] | undefined;
    if (preHook.entityJsonPath && itemOrErrorResponse !== undefined) {
      items = JSONPath({ json: itemOrErrorResponse, path: preHook.entityJsonPath });
    }

    const hookCallResult = await preHook.hookFunc(items);

    if (hookCallResult !== undefined) {
      if (typeof hookCallResult !== 'boolean' && 'errorMessage' in hookCallResult) {
        throw new Error(hookCallResult.errorMessage);
      } else if (hookCallResult === false) {
        if (process.env.NODE_ENV === 'development' && preHook.skipInTests) {
          return;
        }
        let errorMessage = 'Unspecified pre-hook error';
        if (preHook.error) {
          errorMessage = 'Error code ' + preHook.error.errorCode + ':' + preHook.error.errorMessage;
        }
        throw new Error(createErrorMessageWithStatusCode(errorMessage, preHook.error?.statusCode ?? 400));
      } else if (process.env.NODE_ENV === 'development' && hookCallResult === true && preHook.skipInTests) {
        throw new Error('Invalid hook result (=true) when skipInTest is true');
      }
    }
  });
}
