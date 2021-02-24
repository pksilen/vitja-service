import createBackkErrorFromErrorCodeMessageAndStatus
  from "../errors/createBackkErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../errors/backkErrors";

export default function assertIsSortDirection(value: any) {
  if (value.toUpperCase() !== 'ASC' && value.toUpperCase() !== 'DESC') {
    throw createBackkErrorFromErrorCodeMessageAndStatus({
      ...BACKK_ERRORS.INVALID_ARGUMENT,
      errorMessage:
        BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + `${value} in 'sortDirection' property is not a valid sort direction`
    });
  }
}
