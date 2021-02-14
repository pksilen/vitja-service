import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export default function IsIntegerStringOrAny(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isIntegerStringOrAny',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['isIntegerStringOrAny'],
      options: validationOptions,
      validator: {
        validate(value: string) {
          return value === 'any' || !isNaN(parseInt(value, 10));
        }
      },
    });
  };
}
