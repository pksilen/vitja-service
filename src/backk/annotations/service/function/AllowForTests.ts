import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function AllowForTests() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addPrivateServiceFunction(object.constructor, functionName);
  };
}
