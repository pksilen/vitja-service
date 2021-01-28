import { ErrorResponse } from '../../types/ErrorResponse';
import { Entity } from '../../types/entities/Entity';

export interface ErrorCodeAndMessage {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export type PreHook =
  | {
      executePreHookFuncIf?: (valueFromJsonPath?: any) => boolean;
      entityJsonPathForPreHookFuncArg?: string;
      preHookFunc: (
        preHookFuncArg?: any
      ) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean;
      errorMessageOnPreHookFuncFailure?: ErrorCodeAndMessage;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((preHookFuncArg?: any) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean);
