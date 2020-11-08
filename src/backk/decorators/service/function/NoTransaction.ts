import serviceFunctionAnnotationContainer from "./serviceFunctionAnnotationContainer";

export function NoTransaction() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addNonTransactionalServiceFunction(object.constructor, functionName);
  };
}
