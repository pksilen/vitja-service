import { HttpStatus } from "@nestjs/common";
import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";

export default function getBadRequestErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.BAD_REQUEST,
    errorMessage
  }
}
