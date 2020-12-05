import typePropertyAnnotationContainer from '../decorators/typeproperty/typePropertyAnnotationContainer';
import { doesClassPropertyContainCustomValidation } from '../validation/setClassPropertyValidationDecorators';

export default function getTypePropertyModifiers<T>(
  typeMetadata: { [key: string]: string } | undefined,
  Class: new () => T
): { [key: string]: string } {
  return Object.keys(typeMetadata ?? {}).reduce((accumulatedTypePropertyModifiers, propertyName) => {
    const isPrivate = typePropertyAnnotationContainer.isTypePropertyPrivate(Class, propertyName);
    const isReadonly = doesClassPropertyContainCustomValidation(Class, propertyName, 'isUndefined');
    const typePropertyModifiers = isPrivate ? 'private' : 'public' + ' ' + isReadonly ? 'readonly' : '';

    return {
      ...accumulatedTypePropertyModifiers,
      [propertyName]: typePropertyModifiers
    };
  }, {});
}
