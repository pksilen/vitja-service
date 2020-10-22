import { HttpException, HttpStatus } from "@nestjs/common";

export default function assertIsNumber(propertyName: string, value: any) {
  if (typeof value !== 'number') {
    throw new HttpException(
      `Value ${value} in ${propertyName} property must be a number`,
      HttpStatus.BAD_REQUEST
    );
  }
}
