import { ErrorResponse } from "./Backk";
import { HttpStatus } from "@nestjs/common";

export default function getNotFoundErrorResponse(errorMessage: string): ErrorResponse {
  return {
    statusCode: HttpStatus.NOT_FOUND,
    errorMessage
  }
}
