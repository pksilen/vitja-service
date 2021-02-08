import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import { JSONPath } from 'jsonpath-plus';
import { ErrorResponse } from '../../types/ErrorResponse';
import { PreHook } from './PreHook';
import createErrorMessageWithStatusCode from '../../errors/createErrorMessageWithStatusCode';
import isErrorResponse from '../../errors/isErrorResponse';
import { HttpStatusCodes } from '../../constants/constants';

export default async function tryExecutePreHooks<T extends object>(
  preHooks?: PreHook | PreHook[],
  currentEntityOrErrorResponse?: T | ErrorResponse
) {
  if (
    typeof currentEntityOrErrorResponse === 'object' &&
    'errorMessage' in currentEntityOrErrorResponse &&
    isErrorResponse(currentEntityOrErrorResponse)
  ) {
    throw currentEntityOrErrorResponse;
  }

  if (!preHooks) {
    return;
  }

  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook: PreHook) => {
    let items: any[] | undefined;

    if (currentEntityOrErrorResponse !== undefined) {
      let jsonPath = '$';

      if (typeof preHook === 'object' && preHook.entityJsonPathForPreHookFuncArg) {
        jsonPath = preHook.entityJsonPathForPreHookFuncArg;
      }

      items = JSONPath({ json: currentEntityOrErrorResponse, path: jsonPath });
    }

    const hookFunc = typeof preHook === 'function' ? preHook: preHook.preHookFunc;
    let hookCallResult;

    if (typeof preHook === 'object' && preHook.executePreHookFuncIf) {
      const ifResult = await preHook.executePreHookFuncIf(items);
      if (typeof ifResult === 'object' && 'errorMessage' in ifResult) {
        throw ifResult;
      }
      if (ifResult) {
        hookCallResult = await hookFunc(items);
      }
    } else {
      hookCallResult = await hookFunc(items);
    }

    if (hookCallResult !== undefined) {
      if (typeof hookCallResult === 'object' && '_id' in hookCallResult) {
        return;
      }

      if (typeof hookCallResult === 'object' && 'errorMessage' in hookCallResult) {
        throw hookCallResult;
      } else if (typeof preHook === 'object' && hookCallResult === false) {
        if (process.env.NODE_ENV === 'development' && preHook.shouldDisregardFailureWhenExecutingTests) {
          return;
        }

        let errorMessage = 'Unspecified pre-hook error';

        if (preHook.errorMessageOnPreHookFuncFailure) {
          errorMessage = 'Error code ' + preHook.errorMessageOnPreHookFuncFailure.errorCode + ':' + preHook.errorMessageOnPreHookFuncFailure.errorMessage;
        }

        throw new Error(
          createErrorMessageWithStatusCode(
            errorMessage,
            preHook.errorMessageOnPreHookFuncFailure?.statusCode ?? HttpStatusCodes.BAD_REQUEST
          )
        );
      } else if (
        typeof preHook === 'object' &&
        process.env.NODE_ENV === 'development' &&
        hookCallResult === true &&
        preHook.shouldDisregardFailureWhenExecutingTests
      ) {
        throw new Error('Invalid hook result (=true) when disregardFailureInTest is true');
      }
    }
  });
}
