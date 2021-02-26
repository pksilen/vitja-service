import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import createErrorMessageWithStatusCode from '../../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../../constants/constants';
import { CreatePreHook } from './CreatePreHook';

export default async function tryExecuteCreatePreHooks(preHooks: CreatePreHook | CreatePreHook[]) {
  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook) => {
    const hookFunc = typeof preHook === 'function' ? preHook : preHook.isSuccessfulOrTrue;
    let hookCallResult;

    try {
      if (typeof preHook === 'object' && preHook.shouldExecutePreHook) {
        const shouldExecuteResult = await preHook.shouldExecutePreHook();

        if (typeof shouldExecuteResult === 'object' && shouldExecuteResult[1]) {
          throw shouldExecuteResult[1];
        }

        if (
          shouldExecuteResult === true ||
          (typeof shouldExecuteResult === 'object' && shouldExecuteResult[0])
        ) {
          hookCallResult = await hookFunc();
        }
      } else {
        hookCallResult = await hookFunc();
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
    } else if (hookCallResult === false || (typeof hookCallResult === 'object' && hookCallResult !== null)) {
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
  });
}
