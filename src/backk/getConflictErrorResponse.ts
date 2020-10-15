import { HttpStatus } from "@nestjs/common";
import { ErrorResponse, errorResponseSymbol } from "./Backk";


export default function getConflictErrorResponse(errorMessage: string): ErrorResponse {
  return {
    [errorResponseSymbol]: true,
    statusCode: HttpStatus.CONFLICT,
    errorMessage
  }
}
