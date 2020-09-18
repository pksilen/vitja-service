export default async function forEachAsyncParallel<T>(
  array: T[],
  callback: (value: T, index: number, Array: T[]) => unknown
) {
  await Promise.all(array.map(callback));
}
