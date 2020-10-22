import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";


export default function isErrorResponse<T>(possibleErrorResponse: T | void | ErrorResponse): boolean {
  return possibleErrorResponse ? errorResponseSymbol in possibleErrorResponse : false;
}
