import { HttpStatus } from '@nestjs/common';
import { ErrorResponse, errorResponseSymbol } from "./Backk";

export default function getInternalServerErrorResponse(errorMessage: string): ErrorResponse {
  console.log(errorMessage);

  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    errorMessage
  };
}
