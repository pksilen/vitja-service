import { ErrorResponse } from "../../types/ErrorResponse";
import { Entity } from "../../types/entities/Entity";

export interface ErrorCodeAndMessage {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export interface PreHook {
  currentEntityJsonPath?: string;
  isTrueOrSuccessful: (valueFromJsonPath?: any) => Promise<boolean | undefined | void | Entity | ErrorResponse> | boolean;
  error?: ErrorCodeAndMessage;
  disregardInTests?: boolean;
}
