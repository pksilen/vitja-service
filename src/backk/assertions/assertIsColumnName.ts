import { HttpException, HttpStatus } from "@nestjs/common";

export default function assertIsColumnName(propertyName: string, columnName: string) {
  if (columnName.match(/^[a-zA-Z_][a-zA-Z0-9_.]*$/) == null) {
    throw new HttpException(
      `Value ${columnName} in ${propertyName} property is not a valid column name`,
      HttpStatus.BAD_REQUEST
    );
  }
}
