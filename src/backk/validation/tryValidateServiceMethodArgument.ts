import { validateOrReject } from 'class-validator';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import getValidationErrors from './getValidationErrors';

export default async function tryValidateServiceMethodArgument(
  methodName: string,
  obj: object
): Promise<void> {
  try {
    await validateOrReject(obj, {
      groups: ['__backk_firstRound__']
    });

    const isCreateMethod =
      methodName.startsWith('create') || methodName.startsWith('add') || methodName.startsWith('insert');

    const isUpdateMethod =
      methodName.startsWith('update') || methodName.startsWith('modify') || methodName.startsWith('change');

    await validateOrReject(obj, {
      whitelist: true,
      forbidNonWhitelisted: true,
      groups: [
        '__backk_argument__',
        ...(isCreateMethod ? ['__backk_create__'] : []),
        ...(isUpdateMethod ? ['__backk_update__'] : [])
      ]
    });
  } catch (validationErrors) {
    const errorMessage =
      'Error code invalidArgument: Invalid argument: ' + getValidationErrors(validationErrors);
    createErrorFromErrorMessageAndThrowError(createErrorMessageWithStatusCode(errorMessage, 400));
  }
}
