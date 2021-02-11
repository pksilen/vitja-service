import { ErrorResponse } from "../../types/ErrorResponse";
import isErrorResponse from "../../errors/isErrorResponse";
import { PostHook } from "./PostHook";
import { getNamespace } from "cls-hooked";
import createErrorMessageWithStatusCode from "../../errors/createErrorMessageWithStatusCode";
import { HttpStatusCodes } from "../../constants/constants";

export default async function tryExecutePostHook(
  postHook: PostHook,
  responseOrErrorResponse?: any | ErrorResponse
) {
  if (
    typeof responseOrErrorResponse === 'object' &&
    'errorMessage' in responseOrErrorResponse &&
    isErrorResponse(responseOrErrorResponse)
  ) {
    throw responseOrErrorResponse;
  }

  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('isInsidePostHook', true);
  const postHookFunc = typeof postHook === 'function' ? postHook : postHook.postHookFunc;
  let hookCallResult;

  try {
    if (typeof postHook === 'object' && postHook.executePostHookIf) {
      if (postHook.executePostHookIf()) {
        hookCallResult = await postHookFunc();
      }
    } else {
      hookCallResult = await postHookFunc();
    }
  } catch(error) {
    createErrorMessageWithStatusCode(
      error.errorMessage,
      HttpStatusCodes.INTERNAL_SERVER_ERROR
    )
  }

  clsNamespace?.set('isInsidePostHook', false);

  if (typeof hookCallResult === 'object' && 'errorMessage' in hookCallResult) {
    throw hookCallResult;
  }
}
