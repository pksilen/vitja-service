import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export function getConflictErrorMessage(errorMessage: string): string {
  return 409 + ':' + errorMessage;
}
export default function getConflictErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: 409,
    errorMessage: getConflictErrorMessage(errorMessage)
  }
}
