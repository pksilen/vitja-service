import { ErrorCodeAndMessageAndStatus } from '../dbmanager/hooks/PreHook';
import createBackkErrorFromError from './createBackkErrorFromError';
import { HttpStatusCodes } from '../constants/constants';

export default function createErrorResponseFromErrorCodeMessageAndStatus(
  errorCodeMessageAndStatus: ErrorCodeAndMessageAndStatus
) {
  return createBackkErrorFromError(
    new Error(
      (errorCodeMessageAndStatus.statusCode ?? HttpStatusCodes.INTERNAL_SERVER_ERROR) +
        ':Error code ' +
        errorCodeMessageAndStatus.errorCode +
        ':' +
        errorCodeMessageAndStatus.errorMessage
    )
  );
}
