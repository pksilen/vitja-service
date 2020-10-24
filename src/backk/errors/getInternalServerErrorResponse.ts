import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export default function getInternalServerErrorResponse(error: Error): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: 500,
    errorMessage: 500 + ':' + error.message
  };
}
