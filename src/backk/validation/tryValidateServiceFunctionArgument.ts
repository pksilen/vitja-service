import { validateOrReject, ValidationError } from "class-validator";
import createErrorFromErrorMessageAndThrowError from "../errors/createErrorFromErrorMessageAndThrowError";
import createErrorMessageWithStatusCode from "../errors/createErrorMessageWithStatusCode";
import getValidationErrors from "./getValidationErrors";
import { HttpStatusCodes } from "../constants/constants";
import isCreateFunction from "../crudresource/utils/isCreateFunction";
import AbstractDbManager from "../dbmanager/AbstractDbManager";

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

export default async function tryValidateServiceFunctionArgument(
  ServiceClass: Function,
  functionName: string,
  dbManager: AbstractDbManager | undefined,
  obj: object
): Promise<void> {
  try {
    await validateOrReject(obj, {
      groups: ['__backk_firstRound__', ...(dbManager ? [dbManager.getDbManagerType()] : [])]
    });

    await validateOrReject(obj, {
      whitelist: true,
      forbidNonWhitelisted: true,
      groups: [
        '__backk_argument__',
        ...(dbManager ? [dbManager.getDbManagerType()] : []),
        ...(isCreateFunction(ServiceClass, functionName) ? ['__backk_create__'] : []),
        ...(isCreateFunction(ServiceClass, functionName)? [] : ['__backk_update__'])
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