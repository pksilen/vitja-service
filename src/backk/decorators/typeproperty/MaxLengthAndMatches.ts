import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export default function MaxLengthAndMatches(
  maxLength: number,
  regexp: RegExp,
  validationOptions?: ValidationOptions
) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'maxLengthAndMatches',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['maxLengthAndMatches', maxLength, regexp],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // TODO implement array support
          if (value.length > maxLength) {
            return false;
          }
          return !!value.match(regexp);
        },
        defaultMessage: () =>
          propertyName + ' length must be ' + maxLength + ' or less and must match ' + regexp
      }
    });
  };
}
