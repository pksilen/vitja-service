import call, { HttpRequestOptions } from './call';

export default async function makeHttpRequest<T>(
  requestUrl: string,
  requestBodyObject: object,
  options?: HttpRequestOptions,
  ResponseClass?: new () => T
) {
  return await call(requestUrl, requestBodyObject, options, ResponseClass);
}
