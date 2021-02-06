import { registerDecorator, ValidationOptions } from "class-validator";
import { ErrorResponse } from "../../types/ErrorResponse";
import { Name } from "../../types/Name";

export default function IsOneOf(
  getPossibleValuesFunc: () => Promise<Name[] | ErrorResponse>,
  serviceFunctionName: string,
  testValue: string,
  validationOptions?: ValidationOptions
) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isOneOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['isOneOf', serviceFunctionName, testValue],
      options: validationOptions,
      validator: {
        async validate(value: any) {
          const possibleValuesOrErrorResponse = await getPossibleValuesFunc();
          if ('errorMessage' in possibleValuesOrErrorResponse) {
            return false;
          }

          return possibleValuesOrErrorResponse.some((possibleValue) => value === possibleValue.name);
        },
        defaultMessage: () =>
          propertyName + ' must be one of the result of service function call: ' + serviceFunctionName
      }
    });
  };
}
