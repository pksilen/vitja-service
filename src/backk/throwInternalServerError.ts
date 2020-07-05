import { HttpException, HttpStatus } from "@nestjs/common";

export default function throwInternalServerError(error: Error): never {
  console.log(error);

  throw new HttpException(
    { status: HttpStatus.INTERNAL_SERVER_ERROR, message: error.message, stackTrace: error.stack },
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
