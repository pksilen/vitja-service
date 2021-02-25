import { PromiseOfErrorOr } from '../types/PromiseOfErrorOr';
import { BackkError } from '../types/BackkError';

export default async function executeForAll<T, U>(
  values: T[],
  func: (value: T) => PromiseOfErrorOr<U | null>
): PromiseOfErrorOr<null> {
  const finalValues = Array.isArray(values) ? values : [values];

  const possibleError = await finalValues.reduce(
    async (possibleErrorPromise: Promise<BackkError | null | undefined>, value) => {
      const possibleError = await possibleErrorPromise;

      if (possibleError) {
        return possibleError;
      }

      const [, error] = await func(value);
      return error;
    },
    Promise.resolve(null)
  );

  return [null, possibleError];
}
