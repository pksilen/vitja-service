import { HttpException } from "@nestjs/common";
import createErrorResponseFromError from "./createErrorResponseFromError";

export default function createErrorFromErrorMessageAndThrowError(errorMessage: string) {
  const errorResponse = createErrorResponseFromError(new Error(errorMessage));
  throw new HttpException(errorResponse, errorResponse.statusCode);
}
