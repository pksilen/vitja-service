import { HttpStatus } from '@nestjs/common';
import { ErrorResponse, errorResponseSymbol } from "./types/ErrorResponse";

export default function getInternalServerErrorResponse(error: Error): ErrorResponse {
  console.log(error);

  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorMessage: error.message,
    stackTrace: process.env.LOG_LEVEL === 'DEBUG' ? error.stack : undefined
  };
}
