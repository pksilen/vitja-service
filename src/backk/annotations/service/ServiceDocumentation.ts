import serviceAnnotationContainer from './serviceAnnotationContainer';

export default function ServiceDocumentation(docString: string) {
  return function(serviceClass: Function) {
    serviceAnnotationContainer.addDocumentationForService(serviceClass, docString);
  };
}
