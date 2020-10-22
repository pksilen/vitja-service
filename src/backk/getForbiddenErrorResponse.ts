import { HttpStatus } from "@nestjs/common";
import { ErrorResponse, errorResponseSymbol } from "./types/ErrorResponse";

export default function getForbiddenErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.FORBIDDEN,
    errorMessage
  }
}
