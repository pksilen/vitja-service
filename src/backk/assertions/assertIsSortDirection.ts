import { HttpException, HttpStatus } from "@nestjs/common";
import createErrorResponseFromErrorCodeMessageAndStatus
  from "../errors/createErrorResponseFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS_INVALID_ARGUMENT } from "../errors/backkErrors";

export default function assertIsSortDirection(value: any) {
  if (value.toUpperCase() !== 'ASC' && value.toUpperCase() !== 'DESC') {
    throw createErrorResponseFromErrorCodeMessageAndStatus({
      ...BACKK_ERRORS_INVALID_ARGUMENT,
      errorMessage:
        BACKK_ERRORS_INVALID_ARGUMENT + `${value} in 'sortDirection' property is not a valid sort direction`
    });
  }
}
