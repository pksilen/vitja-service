import { BackkError } from "../types/BackkError";

export default async function executeForAll<T, U>(
  values: T[],
  func: (value: T) => Promise<void | [U, BackkError | null]>
): Promise<BackkError | null> {
  const finalValues = Array.isArray(values) ? values : [values];

  return await finalValues.reduce(
    async (possibleErrorResponsePromise: Promise<BackkError | null>, value) => {
      const possibleErrorResponse = await possibleErrorResponsePromise;
      if (possibleErrorResponse) {
        return possibleErrorResponse;
      }

      const result = await func(value);
      return typeof result === 'object' && 'errorMessage' in result ? result : undefined;
    },
    Promise.resolve(undefined)
  );
}
