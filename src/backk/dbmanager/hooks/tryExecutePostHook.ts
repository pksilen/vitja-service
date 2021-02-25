import { PostHook } from "./PostHook";
import { getNamespace } from "cls-hooked";
import createErrorMessageWithStatusCode from "../../errors/createErrorMessageWithStatusCode";
import { HttpStatusCodes } from "../../constants/constants";
import { ErrorOr } from "../../types/ErrorOr";
import { BackkEntity } from "../../types/entities/BackkEntity";
import { SubEntity } from "../../types/entities/SubEntity";

export default async function tryExecutePostHook<T extends BackkEntity | SubEntity>(postHook: PostHook<T>, [entity, error]: ErrorOr<T>) {
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
        [, hookCallError] = await postHookFunc(entity ?? null);
      }
    } else {
      [, hookCallError] = await postHookFunc(entity ?? null);
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
