import { HttpException } from '@nestjs/common';
import { ErrorResponse } from '../types/ErrorResponse';
import getErrorResponse from './getErrorResponse';

export default function throwHttpException(errorResponse: ErrorResponse) {
  throw new HttpException(getErrorResponse(new Error(errorResponse.errorMessage)), errorResponse.statusCode);
}
