import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function FunctionDocumentation(docString: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addDocumentationForServiceFunction(
      object.constructor,
      functionName,
      docString
    );
  };
}
