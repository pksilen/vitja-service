import { ErrorResponse, errorResponseSymbol } from '../types/ErrorResponse';

export default function isErrorResponse<T>(
  possibleErrorResponse: T | void | ErrorResponse,
  httpStatusCode?: number
): boolean {
  if (httpStatusCode === undefined) {
    return possibleErrorResponse ? errorResponseSymbol in possibleErrorResponse : false;
  }

  return possibleErrorResponse
    ? errorResponseSymbol in possibleErrorResponse &&
        'statusCode' in possibleErrorResponse &&
        possibleErrorResponse.statusCode === httpStatusCode
    : false;
}
