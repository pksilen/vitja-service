import typePropertyAnnotationContainer from '../annotations/typeproperty/typePropertyAnnotationContainer';

export default function shouldHashValue(propertyName: string, EntityClass: Function): boolean {
  return (
    propertyName.toLowerCase().includes('password') &&
    !typePropertyAnnotationContainer.isTypePropertyNotHashed(EntityClass, propertyName)
  );
}
