import { ErrorResponse } from "../../types/ErrorResponse";

export interface PreHook {
  jsonPath?: string;
  hookFunc: (value?: any) => Promise<boolean | undefined | ErrorResponse> | boolean;
  errorMessage?: string;
}
