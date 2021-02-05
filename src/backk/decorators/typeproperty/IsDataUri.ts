import { registerDecorator, ValidationOptions } from 'class-validator';
import isDataUri from 'validator/lib/isDataURI';

export default function IsDataUri(validationOptions?: ValidationOptions) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isAnyString',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['isAnyString'],
      options: validationOptions,
      validator: {
        validate(value: any) {
          // TODO: support validationOption each:true
          return isDataUri(value);
        }
      }
    });
  };
}
