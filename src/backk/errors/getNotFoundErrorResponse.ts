import { HttpStatus } from "@nestjs/common";
import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export default function getNotFoundErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.NOT_FOUND,
    errorMessage
  }
}
