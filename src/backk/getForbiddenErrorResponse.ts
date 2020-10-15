import { HttpStatus } from "@nestjs/common";
import { ErrorResponse, errorResponseSymbol } from "./Backk";

export default function getForbiddenErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.FORBIDDEN,
    errorMessage
  }
}
