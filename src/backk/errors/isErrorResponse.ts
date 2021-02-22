import { BackkError, errorResponseSymbol } from '../types/BackkError';

export default function isErrorResponse<T>(
  possibleErrorResponse: T | BackkError | null,
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
