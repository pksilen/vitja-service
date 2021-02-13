import { HttpException, HttpStatus } from '@nestjs/common';
import createErrorResponseFromErrorCodeMessageAndStatus from '../errors/createErrorResponseFromErrorCodeMessageAndStatus';
import { BACKK_ERRORS_INVALID_ARGUMENT } from '../errors/backkErrors';

export default function assertIsNumber(propertyName: string, value: any) {
  if (typeof value !== 'number') {
    throw createErrorResponseFromErrorCodeMessageAndStatus({
      ...BACKK_ERRORS_INVALID_ARGUMENT,
      errorMessage:
        BACKK_ERRORS_INVALID_ARGUMENT + `value ${value} in ${propertyName} property must be a number`
    });
  }
}
