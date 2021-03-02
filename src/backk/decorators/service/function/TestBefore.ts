import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function TestBefore(serviceFunctionName: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addTestBefore(object.constructor, functionName, serviceFunctionName);
  };
}
