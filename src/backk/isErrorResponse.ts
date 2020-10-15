import { ErrorResponse, errorResponseSymbol } from './Backk';

export default function isErrorResponse<T>(possibleErrorResponse: T | void | ErrorResponse): boolean {
  return possibleErrorResponse ? errorResponseSymbol in possibleErrorResponse : false;
}
