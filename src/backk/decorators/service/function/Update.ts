import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function Update() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addUpdateAnnotation(object.constructor, functionName);
  };
}
