import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export default function AllowAnyString(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'allowAnyString',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['allowAnyString'],
      options: validationOptions,
      validator: {
        validate() {
          // TODO: support validationOption each:true
          return true;
        }
      },
    });
  };
}
