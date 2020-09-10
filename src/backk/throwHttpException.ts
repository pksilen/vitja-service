import { ErrorResponse } from "./Backk";
import { HttpException } from "@nestjs/common";

export default function throwHttpException(error: ErrorResponse) {
  throw new HttpException(error, error.statusCode);
}
