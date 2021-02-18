import { ErrorResponse } from "../types/ErrorResponse";

export default async function executeForAll<T, U>(
  values: T[],
  func: (value: T) => Promise<void | U | ErrorResponse>
): Promise<void | ErrorResponse> {
  const finalValues = Array.isArray(values) ? values : [values];

  return await finalValues.reduce(
    async (possibleErrorResponsePromise: Promise<void | ErrorResponse>, value) => {
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
