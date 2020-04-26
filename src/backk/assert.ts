import { HttpException, HttpStatus } from '@nestjs/common';

export function assertIsColumnName(propertyName: string, columnName: string) {
  if (columnName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/) == null) {
    throw new HttpException(
      `Value ${columnName} in ${propertyName} property is not a valid column name`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export function assertIsSortDirection(value: any) {
  if (value.toUpperCase() !== 'ASC' && value.toUpperCase() !== 'DESC') {
    throw new HttpException(
      `${value} in 'sortDirection' property is not a valid sort direction`,
      HttpStatus.BAD_REQUEST
    );
  }
}

export function assertIsNumber(propertyName: string, value: any) {
  if (typeof value !== 'number') {
    throw new HttpException(
      `Value ${value} in ${propertyName} property must be a number`,
      HttpStatus.BAD_REQUEST
    );
  }
}
