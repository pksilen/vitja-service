import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from "./Backk";

export default function getInternalServerErrorResponse(errorMessage: string): ErrorResponse {
  console.log(errorMessage);

  return {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    errorMessage
  };
}
