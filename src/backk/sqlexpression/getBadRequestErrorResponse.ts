import { HttpStatus } from "@nestjs/common";
import { ErrorResponse } from "../Backk";


export default function getBadRequestErrorResponse(errorMessage: string): ErrorResponse {
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    errorMessage
  }
}
