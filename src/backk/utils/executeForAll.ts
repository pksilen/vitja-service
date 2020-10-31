import { ErrorResponse } from '../types/ErrorResponse';

export default async function executeForAll(
  values: any[],
  func: (value: any) => Promise<void | ErrorResponse>
): Promise<void | ErrorResponse> {
  const finalValues = Array.isArray(values) ? values : [values];
  return await finalValues.reduce(async (errorResponseAccumulator: Promise<void | ErrorResponse>, value) => {
    return (await errorResponseAccumulator) || (await func(value));
  }, Promise.resolve(undefined));
}
