import forEachAsyncSequential from "../../utils/forEachAsyncSequential";
import { ErrorResponse } from "../../types/ErrorResponse";
import { PreHook } from "./PreHook";
import createErrorMessageWithStatusCode from "../../errors/createErrorMessageWithStatusCode";
import { HttpStatusCodes } from "../../constants/constants";
import { Entity } from "../../types/entities/Entity";
import { SubEntity } from "../../types/entities/SubEntity";

export default async function tryExecutePreHooks<T extends Entity | SubEntity>(
  preHooks?: PreHook<T> | PreHook<T>[],
  currentEntityOrErrorResponse?: T | ErrorResponse
) {
  if (currentEntityOrErrorResponse === undefined || !preHooks) {
    return;
  }

  if (
    'errorMessage' in currentEntityOrErrorResponse
  ) {
    throw currentEntityOrErrorResponse;
  }

  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook: PreHook<T>) => {
    let items: any[] | undefined;
    const hookFunc = typeof preHook === 'function' ? preHook : preHook.isSuccessfulOrTrue;
    let hookCallResult;

    try {
      if (typeof preHook === 'object' && preHook.shouldExecutePreHook) {
        const ifResult = await preHook.shouldExecutePreHook(currentEntityOrErrorResponse);

        if (typeof ifResult === 'object' && 'errorMessage' in ifResult) {
          throw ifResult;
        }

        if (ifResult) {
          hookCallResult = await hookFunc(currentEntityOrErrorResponse);
        }
      } else {
        hookCallResult = await hookFunc(currentEntityOrErrorResponse);
      }
    } catch (error) {
      throw new Error(
        createErrorMessageWithStatusCode(error.errorMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR)
      );
    }

    if (hookCallResult !== undefined) {
      if (typeof hookCallResult === 'object' && '_id' in hookCallResult) {
        return;
      }

      if (typeof hookCallResult === 'object' && 'errorMessage' in hookCallResult) {
        throw hookCallResult;
      } else if (hookCallResult === false) {
        if (typeof preHook === 'object') {
          if (process.env.NODE_ENV === 'development' && preHook.shouldDisregardFailureWhenExecutingTests) {
            return;
          }

          let errorMessage = 'Unspecified pre-hook error';

          if (preHook.errorMessage) {
            errorMessage =
              'Error code ' +
              preHook.errorMessage.errorCode +
              ':' +
              preHook.errorMessage.errorMessage;
          }

          throw new Error(
            createErrorMessageWithStatusCode(
              errorMessage,
              preHook.errorMessage?.statusCode ?? HttpStatusCodes.BAD_REQUEST
            )
          );
        }

        throw new Error(
          createErrorMessageWithStatusCode(
            'Pre-hook evaluated to false without specific error message',
            HttpStatusCodes.BAD_REQUEST
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
