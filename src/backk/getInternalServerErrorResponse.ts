import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from "./Backk";

export default function getInternalServerErrorResponse(error: Error): ErrorResponse {
  console.log(error);

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorMessage: error.message,
    stackTrace: process.env.LOG_LEVEL === 'DEBUG' ? error.stack : undefined
  };
}
