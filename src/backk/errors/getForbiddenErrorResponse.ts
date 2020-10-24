import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export default function getForbiddenErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: 403,
    errorMessage: 403 + ':' + errorMessage
  }
}
