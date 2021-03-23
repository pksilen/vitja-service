import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import { PreHook } from './PreHook';
import createErrorMessageWithStatusCode from '../../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../../constants/constants';
import { BackkEntity } from '../../types/entities/BackkEntity';
import { SubEntity } from '../../types/entities/SubEntity';

export default async function tryExecutePreHooks<T extends BackkEntity | SubEntity>(
  preHooks: PreHook | PreHook[]
) {
  await forEachAsyncSequential(Array.isArray(preHooks) ? preHooks : [preHooks], async (preHook: PreHook) => {
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
  });
}
