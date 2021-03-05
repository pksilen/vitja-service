import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function ExpectAfterThisOperationEntityToContainInTests(fieldPathNameToFieldValueMap: {
  [key: string]: any;
}) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.expectServiceFunctionEntityToContainInTests(
      object.constructor,
      functionName,
      fieldPathNameToFieldValueMap
    );
  };
}
