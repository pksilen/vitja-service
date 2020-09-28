import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function AllowForInternalUse() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addServiceFunctionAllowedForInternalUse(
      object.constructor,
      functionName
    );
  };
}
