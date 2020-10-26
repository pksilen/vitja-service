import { getFromContainer, MetadataStorage, validateOrReject, ValidationError } from 'class-validator';
import throwHttpException from '../errors/throwHttpException';
import getBadRequestErrorResponse from '../errors/getBadRequestErrorResponse';

function getValidationErrors(errorOrValidationErrors: ValidationError[] | Error): string {
  return errorOrValidationErrors instanceof Error
    ? errorOrValidationErrors.message
    : errorOrValidationErrors
        .map((validationError: ValidationError) => {
          if (validationError.constraints) {
            return Object.values(validationError.constraints)
              .map((constraint) => constraint)
              .join(', ');
          } else {
            return validationError.property + ': ' + getValidationErrors(validationError.children);
          }
        })
        .join(', ');
}

export default async function tryValidateObject(obj: object): Promise<void> {

  try {
    await validateOrReject(obj, {
      groups: ['__backk_firstRound__']
    });

    await validateOrReject(obj, {
      whitelist: true,
      forbidNonWhitelisted: true
    });
  } catch (validationErrors) {
    const errorMessage = getValidationErrors(validationErrors);
    throwHttpException(getBadRequestErrorResponse(errorMessage));
  }
}
