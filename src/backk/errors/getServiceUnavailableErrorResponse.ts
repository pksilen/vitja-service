import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export default function getServiceUnavailableErrorResponse(errorMessage: string): ErrorResponse {
  console.log(errorMessage);

  return {
    [errorResponseSymbol]: true,
    statusCode: 503,
    errorMessage: 503 + ':' + errorMessage
  };
}
