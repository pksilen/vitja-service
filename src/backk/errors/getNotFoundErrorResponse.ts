import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export default function getNotFoundErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: 404,
    errorMessage: 404 + ':' + errorMessage
  }
}
