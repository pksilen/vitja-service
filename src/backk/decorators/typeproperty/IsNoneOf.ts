import { registerDecorator, ValidationOptions } from "class-validator";
import { BackkError } from "../../types/BackkError";
import { Name } from "../../types/Name";

export default function IsNoneOf(
  getPossibleValuesFunc: () => Promise<[Name[], BackkError | null]>,
  serviceFunctionName: string,
  testValue: string,
  validationOptions?: ValidationOptions
) {
  return function(object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isNoneOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: ['isNoneOf', serviceFunctionName, testValue],
      options: validationOptions,
      validator: {
        async validate(value: any) {
          const possibleValuesOrErrorResponse = await getPossibleValuesFunc();
          if ('errorMessage' in possibleValuesOrErrorResponse) {
            return false;
          }

          return !possibleValuesOrErrorResponse.some((possibleValue) => value === possibleValue.name);
        },
        defaultMessage: () =>
          propertyName + ' may not be anyone from the result of service function call: ' + serviceFunctionName
      }
    });
  };
}
