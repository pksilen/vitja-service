import { ErrorResponse } from '../../types/ErrorResponse';
import { Entity } from '../../types/entities/Entity';

export interface ErrorCodeAndMessageAndStatus {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export type PreHook =
  | {
      executePreHookFuncIf?: (valueFromJsonPath?: any) => boolean | Promise<boolean | ErrorResponse>;
      entityJsonPathForPreHookFuncArg?: string;
      preHookFunc: (
        preHookFuncArg?: any
      ) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean;
      errorMessageOnPreHookFuncExecFailure?: ErrorCodeAndMessageAndStatus;
      shouldDisregardFailureWhenExecutingTests?: boolean;
    }
  | ((preHookFuncArg?: any) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean);
