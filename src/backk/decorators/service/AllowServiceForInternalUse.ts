import serviceAnnotationContainer from "./serviceAnnotationContainer";

export default function AllowServiceForInternalUse() {
  return function(serviceClass: Function) {
    serviceAnnotationContainer.addServiceAllowedForInternalUse(serviceClass);
  }
}
