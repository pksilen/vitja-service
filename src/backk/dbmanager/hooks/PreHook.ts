import { ErrorResponse } from "../../types/ErrorResponse";

export interface ErrorCodeAndMessage {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export interface PreHook {
  entityJsonPath?: string;
  hookFunc: (valueFromJsonPath?: any) => Promise<boolean | undefined | void | ErrorResponse> | boolean;
  error?: ErrorCodeAndMessage;
  skipInTests?: boolean;
}
