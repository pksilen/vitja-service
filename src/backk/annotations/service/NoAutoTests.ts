import serviceAnnotationContainer from "./serviceAnnotationContainer";

export default function NoAutoTests(serviceClass: Function) {
  serviceAnnotationContainer.addNoAutoTestsAnnotationToServiceClass(serviceClass);
}
