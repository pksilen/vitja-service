import { HttpException } from "@nestjs/common";
import { ErrorResponse } from "./types/ErrorResponse";

export default function throwHttpException(error: ErrorResponse) {
  throw new HttpException(error, error.statusCode);
}
