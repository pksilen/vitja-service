import { ErrorResponse } from '../types/ErrorResponse';

export default function getErrorResponseOrResultOf<T>(
  itemOrErrorResponse: T | ErrorResponse,
  func: (value: T) => boolean
): boolean | ErrorResponse {
  return typeof itemOrErrorResponse === 'object' &&
    'errorMessage' in itemOrErrorResponse
    ? itemOrErrorResponse
    : func(itemOrErrorResponse);
}
