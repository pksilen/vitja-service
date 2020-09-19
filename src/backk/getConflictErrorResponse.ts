import { HttpStatus } from "@nestjs/common";
import { ErrorResponse } from "./Backk";


export default function getConflictErrorResponse(errorMessage: string): ErrorResponse {
  return {
    statusCode: HttpStatus.CONFLICT,
    errorMessage
  }
}
