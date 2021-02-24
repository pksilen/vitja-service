import { PostHook } from "./PostHook";
import { getNamespace } from "cls-hooked";
import createErrorMessageWithStatusCode from "../../errors/createErrorMessageWithStatusCode";
import { HttpStatusCodes } from "../../constants/constants";
import { ErrorOr } from "../../types/PromiseOfErrorOr";

export default async function tryExecutePostHook(postHook: PostHook, [, error]: ErrorOr<any>) {
  if (error) {
    throw error;
  }

  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('isInsidePostHook', true);
  const postHookFunc = typeof postHook === 'function' ? postHook : postHook.isSuccessful;
  let hookCallError;

  try {
    if (typeof postHook === 'object' && postHook.shouldExecutePostHook) {
      if (postHook.shouldExecutePostHook()) {
        [, hookCallError] = await postHookFunc();
      }
    } else {
      [, hookCallError] = await postHookFunc();
    }
  } catch (error) {
    throw new Error(
      createErrorMessageWithStatusCode(error.errorMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR)
    );
  }

  clsNamespace?.set('isInsidePostHook', false);

  if (hookCallError) {
    throw hookCallError;
  }
}
