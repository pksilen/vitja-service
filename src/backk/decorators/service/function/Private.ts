import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';
import typePropertyAnnotationContainer from "../../typeproperty/typePropertyAnnotationContainer";

export function Private() {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionOrPropertyName: string) {
    if (typeof (object as any)[functionOrPropertyName] === 'function') {
      serviceFunctionAnnotationContainer.addPrivateServiceFunction(object.constructor, functionOrPropertyName);
    } else {
      typePropertyAnnotationContainer.setTypePropertyAsPrivate(object.constructor, functionOrPropertyName);
    }
  };
}
