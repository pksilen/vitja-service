import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import { PreHook } from './PreHook';
import createErrorMessageWithStatusCode from '../../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../../constants/constants';
import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';
import { ErrorOr } from '../../types/ErrorOr';

export default async function tryExecutePreHooks<T extends BackkEntity | SubEntity>(
  preHooks: PreHook<T> | PreHook<T>[],
  [currentEntity, error]: ErrorOr<T>
) {
  if (error || !currentEntity) {
    throw error;
  }

  await forEachAsyncSequential(
    Array.isArray(preHooks) ? preHooks : [preHooks],
    async (preHook: PreHook<T>) => {
      const hookFunc = typeof preHook === 'function' ? preHook : preHook.isSuccessfulOrTrue;
      let hookCallResult;

      try {
        if (typeof preHook === 'object' && preHook.shouldExecutePreHook) {
          const shouldExecuteResult = await preHook.shouldExecutePreHook(currentEntity);

          if (typeof shouldExecuteResult === 'object' && shouldExecuteResult[1]) {
            throw shouldExecuteResult[1];
          }

          if (
            shouldExecuteResult === true ||
            (typeof shouldExecuteResult === 'object' && shouldExecuteResult[0])
          ) {
            hookCallResult = await hookFunc(currentEntity);
          }
        } else {
          hookCallResult = await hookFunc(currentEntity);
        }
      } catch (error) {
        throw new Error(
          createErrorMessageWithStatusCode(error.errorMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR)
        );
      }

      if (Array.isArray(hookCallResult) && hookCallResult[1]) {
        if (
          process.env.NODE_ENV === 'development' &&
          typeof preHook === 'object' &&
          preHook.shouldDisregardFailureWhenExecutingTests
        ) {
          return;
        }

        throw hookCallResult[1];
      } else if (
        hookCallResult === false ||
        (typeof hookCallResult === 'object' && hookCallResult !== null)
      ) {
        if (typeof preHook === 'object') {
          if (process.env.NODE_ENV === 'development' && preHook.shouldDisregardFailureWhenExecutingTests) {
            return;
          }

          let errorMessage = 'Pre-hook evaluated to false without specific error message';

          if (preHook.errorMessage) {
            errorMessage =
              'Error code ' + preHook.errorMessage.errorCode + ':' + preHook.errorMessage.errorMessage;
          }

          throw new Error(
            createErrorMessageWithStatusCode(
              errorMessage,
              preHook.errorMessage?.statusCode ?? HttpStatusCodes.BAD_REQUEST
            )
          );
        }
      } else if (
        process.env.NODE_ENV === 'development' &&
        typeof preHook === 'object' &&
        preHook.shouldDisregardFailureWhenExecutingTests
      ) {
        throw new Error(
          'Invalid successful hook call result when shouldDisregardFailureWhenExecutingTests was set to true'
        );
      }
    }
  );
}
