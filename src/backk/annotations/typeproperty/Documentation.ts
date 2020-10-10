import typeAnnotationContainer from './typePropertyAnnotationContainer';

export function Documentation(docString: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, propertyName: string) {
    typeAnnotationContainer.addDocumentationForTypeProperty(object.constructor, propertyName, docString);
  };
}
