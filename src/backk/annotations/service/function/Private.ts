import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function Private() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addPrivateServiceFunction(object.constructor, functionName);
  };
}
