import createErrorResponseFromErrorCodeMessageAndStatus
  from "../errors/createErrorResponseFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../errors/backkErrors";

export default function assertIsColumnName(propertyName: string, columnName: string) {
  if (columnName.match(/^[a-zA-Z_][a-zA-Z0-9_.]*$/) == null) {
    throw createErrorResponseFromErrorCodeMessageAndStatus({
      ...BACKK_ERRORS.INVALID_ARGUMENT,
      errorMessage:
        BACKK_ERRORS.INVALID_ARGUMENT.errorMessage +
        `value ${columnName} in ${propertyName} property is not a valid column name`
    });
  }
}
