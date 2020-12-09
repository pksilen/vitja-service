import { getFromContainer, MetadataStorage, validateOrReject, ValidationError } from "class-validator";
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import getValidationErrors from './getValidationErrors';
import { HttpStatusCodes } from "../constants/constants";
import _Id from "../types/id/_Id";

function filterOutManyToManyIdErrors(validationErrors: ValidationError[]) {
  validationErrors.forEach((validationError) => {
    if (validationError.constraints) {
      validationError.constraints = Object.entries(validationError.constraints).reduce(
        (accumulatedConstraints, [validationName, validationErrorMessage]) => {
          if (validationName === 'isUndefined' && validationErrorMessage === '_id is not allowed') {
            return accumulatedConstraints;
          }
          return { ...accumulatedConstraints, [validationName]: validationErrorMessage };
        },
        {}
      );
    }

    if (validationError.children?.length > 0) {
      filterOutManyToManyIdErrors(validationError.children);
    }
  });
}

function getValidationErrorConstraintsCount(validationErrors: ValidationError[]): number {
  return validationErrors.reduce((constraintsCount, validationError) => {
    const newConstraintsCount = constraintsCount + Object.keys(validationError.constraints ?? {}).length;
    return validationError.children?.length > 0
      ? newConstraintsCount + getValidationErrorConstraintsCount(validationError.children)
      : newConstraintsCount;
  }, 0);
}

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

    const isDeleteMethod =
      methodName.startsWith('delete') ||
      methodName.startsWith('remove') ||
      methodName.startsWith('erase') ||
      methodName.startsWith('destroy');

    await validateOrReject(obj, {
      whitelist: true,
      forbidNonWhitelisted: true,
      groups: [
        '__backk_argument__',
        ...(isCreateMethod ? ['__backk_create__'] : []),
        ...(isCreateMethod ? [] : ['__backk_update__'])
      ]
    });
  } catch (validationErrors) {
    validationErrors.forEach((validationError: ValidationError) => {
      if (validationError.children) {
        filterOutManyToManyIdErrors(validationError.children);
      }
    });

    if (getValidationErrorConstraintsCount(validationErrors) === 0) {
      return;
    }

    const errorMessage =
      'Error code invalidArgument: Invalid argument: ' + getValidationErrors(validationErrors);
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(errorMessage, HttpStatusCodes.BAD_REQUEST)
    );
  }
}
