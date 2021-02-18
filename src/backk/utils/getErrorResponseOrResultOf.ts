import { ErrorResponse } from '../types/ErrorResponse';

export default async function awaitOperationAndGetResultOfPredicate<T>(
  dbOperationResultPromise: Promise<T | ErrorResponse>,
  func: (entity: T) => boolean
): Promise<boolean | ErrorResponse> {
  const entityOrErrorResponse = await dbOperationResultPromise;

  return typeof entityOrErrorResponse === 'object' &&
    'errorMessage' in entityOrErrorResponse
    ? entityOrErrorResponse
    : func(entityOrErrorResponse);
}
