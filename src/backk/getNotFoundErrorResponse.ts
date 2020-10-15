import { ErrorResponse, errorResponseSymbol } from "./Backk";
import { HttpStatus } from "@nestjs/common";

export default function getNotFoundErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.NOT_FOUND,
    errorMessage
  }
}
