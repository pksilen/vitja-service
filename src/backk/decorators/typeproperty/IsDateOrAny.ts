import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export default function IsDateOrAny(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isDateOrAny',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['isDateOrAny'],
      options: validationOptions,
      validator: {
        validate(value: string | Date) {
          return value === 'any' || value instanceof Date;
        }
      },
    });
  };
}
