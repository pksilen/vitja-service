import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function ExpectResponseValueToContainInTests(fieldNamePathToFieldValueMap: { [key: string]: any }) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.expectServiceFunctionResponseValueToContainInTests(
      object.constructor,
      functionName,
      fieldNamePathToFieldValueMap
    );
  };
}
