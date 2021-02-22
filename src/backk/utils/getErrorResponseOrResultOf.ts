import { BackkError } from '../types/BackkError';

export default async function awaitOperationAndGetResultOfPredicate<T>(
  dbOperationResultPromise: Promise<[T, BackkError | null]>,
  func: (entity: T) => boolean
): Promise<boolean | BackkError> {
  const entityOrErrorResponse = await dbOperationResultPromise;

  return typeof entityOrErrorResponse === 'object' &&
    'errorMessage' in entityOrErrorResponse
    ? entityOrErrorResponse
    : func(entityOrErrorResponse);
}
