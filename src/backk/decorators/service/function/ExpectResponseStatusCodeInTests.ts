import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function ExpectResponseStatusCodeInTests(statusCode: number) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addExpectedResponseStatusCodeInTestsForServiceFunction(
      object.constructor,
      functionName,
      statusCode
    );
  };
}
