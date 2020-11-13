import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsExprTrue(func: (value: any) => boolean, errorMessage: string, validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, propertyName: string) {
    registerDecorator({
      name: 'isExprTrue',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['isExprTrue', func],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return func(args.object);
        },
        defaultMessage: () => errorMessage
      }
    });
  };
}
