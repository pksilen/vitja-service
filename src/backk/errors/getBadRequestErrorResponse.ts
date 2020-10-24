import { ErrorResponse, errorResponseSymbol } from '../types/ErrorResponse';

export function getBadRequestErrorMessage(errorMessage: string): string {
  return 400 + ':' + errorMessage;
}

export default function getBadRequestErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: 400,
    errorMessage: getBadRequestErrorMessage(errorMessage)
  };
}
