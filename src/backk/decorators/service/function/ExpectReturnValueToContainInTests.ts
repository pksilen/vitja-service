import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function ExpectReturnValueToContainInTests(fieldPathNameToFieldValueMap: { [key: string]: any }) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.expectServiceFunctionReturnValueToContainInTests(
      object.constructor,
      functionName,
      fieldPathNameToFieldValueMap
    );
  };
}
