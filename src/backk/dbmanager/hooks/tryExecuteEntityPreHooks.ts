import forEachAsyncSequential from "../../utils/forEachAsyncSequential";
import createErrorMessageWithStatusCode from "../../errors/createErrorMessageWithStatusCode";
import { HttpStatusCodes } from "../../constants/constants";
import { BackkEntity } from "../../types/entities/BackkEntity";
import { SubEntity } from "../../types/entities/SubEntity";
import { EntityPreHook } from "./EntityPreHook";

export default async function tryExecuteEntityPreHooks<T extends BackkEntity | SubEntity>(
  preHooks: EntityPreHook<T> | EntityPreHook<T>[],
  entity: T
) {
  await forEachAsyncSequential(
    Array.isArray(preHooks) ? preHooks : [preHooks],
    async (preHook: EntityPreHook<T>) => {
      const hookFunc = typeof preHook === 'function' ? preHook : preHook.isSuccessfulOrTrue;
      let hookCallResult;

      try {
        if (typeof preHook === 'object' && preHook.shouldExecutePreHook) {
          const shouldExecuteResult = await preHook.shouldExecutePreHook(entity);

          if (typeof shouldExecuteResult === 'object' && shouldExecuteResult[1]) {
            throw shouldExecuteResult[1];
          }

          if (
            shouldExecuteResult === true ||
            (typeof shouldExecuteResult === 'object' && shouldExecuteResult[0])
          ) {
            hookCallResult = await hookFunc(entity);
          }
        } else {
          hookCallResult = await hookFunc(entity);
        }
      } catch (error) {
        throw new Error(
          createErrorMessageWithStatusCode(error.errorMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR)
        );
      }

      if (Array.isArray(hookCallResult) && hookCallResult[1]) {
        throw hookCallResult[1];
      } else if (
        hookCallResult === false ||
        (typeof hookCallResult === 'object' && !Array.isArray(hookCallResult) && hookCallResult !== null)
      ) {
        if (typeof preHook === 'object') {
          let errorMessage = 'Pre-hook evaluated to false without specific error message';

          if (preHook.error) {
            errorMessage = 'Error code ' + preHook.error.errorCode + ':' + preHook.error.message;
          }

          throw new Error(
            createErrorMessageWithStatusCode(
              errorMessage,
              preHook.error?.statusCode ?? HttpStatusCodes.BAD_REQUEST
            )
          );
        }
      }
    }
  );
}
