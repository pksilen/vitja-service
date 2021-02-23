import { BackkError } from '../types/BackkError';

export default async function awaitOperationAndGetResultOfPredicate<T>(
  dbOperationResultPromise: Promise<[T, BackkError | null]>,
  predicateFunc: (entity: T) => boolean
): Promise<boolean | BackkError> {
  const [entity, error] = await dbOperationResultPromise;
  return error ?? predicateFunc(entity);
}
