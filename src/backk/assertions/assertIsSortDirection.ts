import { HttpException, HttpStatus } from "@nestjs/common";

export default function assertIsSortDirection(value: any) {
  if (value.toUpperCase() !== 'ASC' && value.toUpperCase() !== 'DESC') {
    throw new HttpException(
      `${value} in 'sortDirection' property is not a valid sort direction`,
      HttpStatus.BAD_REQUEST
    );
  }
}
