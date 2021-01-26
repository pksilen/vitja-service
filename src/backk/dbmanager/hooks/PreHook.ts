import { ErrorResponse } from "../../types/ErrorResponse";
import { Entity } from "../../types/entities/Entity";

export interface ErrorCodeAndMessage {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export interface PreHook {
  hookFuncArgFromCurrentEntityJsonPath?: string;
  expectTrueOrSuccess: (valueFromJsonPath?: any) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean;
  error?: ErrorCodeAndMessage;
  shouldDisregardFailureInTests?: boolean;
}
