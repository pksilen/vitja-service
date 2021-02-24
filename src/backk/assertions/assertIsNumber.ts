import createBackkErrorFromErrorCodeMessageAndStatus
  from "../errors/createBackkErrorFromErrorCodeMessageAndStatus";
import { BACKK_ERRORS } from "../errors/backkErrors";

export default function assertIsNumber(propertyName: string, value: any) {
  if (typeof value !== 'number') {
    throw createBackkErrorFromErrorCodeMessageAndStatus({
      ...BACKK_ERRORS.INVALID_ARGUMENT,
      errorMessage:
        BACKK_ERRORS.INVALID_ARGUMENT.errorMessage + `value ${value} in ${propertyName} property must be a number`
    });
  }
}
