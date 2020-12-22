import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export type HeaderValueGenerator = (arg: object, resp: any) => string | undefined;
export type HttpHeaders = { [key: string]: string | HeaderValueGenerator | undefined };

export function ResponseHeaders(headers: HttpHeaders) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addResponseHeadersForServiceFunction(
      object.constructor,
      functionName,
      headers
    );
  };
}
