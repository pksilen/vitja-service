import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsExprTrue(expression: string, validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, propertyName: string) {
    if (expression.match(/require\s*\(/) || expression.match(/import\s*\(/)) {
      throw new Error('Expression cannot use require or import');
    }

    // noinspection DynamicallyGeneratedCodeJS
    registerDecorator({
      name: 'isExprTrue',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [new Function('with(arguments[0]) return ' + expression)],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [func] = args.constraints;
          return func.call(null, args.object);
        },
        defaultMessage: () => 'Expression ' + expression + ' does not evaluate to true'
      }
    });
  };
}
