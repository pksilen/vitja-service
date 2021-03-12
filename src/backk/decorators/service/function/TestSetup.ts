import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function TestSetup(serviceFunctionsToExecute: string[]) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addTestSetup(
      object.constructor,
      functionName,
      serviceFunctionsToExecute
    );
  };
}
