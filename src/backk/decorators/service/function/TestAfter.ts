import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function TestAfter(serviceFunctionName: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addTestAfter(object.constructor, functionName, serviceFunctionName);
  };
}
