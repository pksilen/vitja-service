import { ErrorResponse } from "../../types/ErrorResponse";

export interface ErrorCodeAndMessage {
  errorCode: string;
  errorMessage: string;
  statusCode?: number;
}

export interface PreHook {
  jsonPath?: string;
  hookFunc: (value?: any) => Promise<boolean | undefined | ErrorResponse> | boolean;
  error?: ErrorCodeAndMessage;
}
