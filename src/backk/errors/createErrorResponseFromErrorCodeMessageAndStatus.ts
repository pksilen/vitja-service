import { ErrorCodeAndMessageAndStatus } from '../dbmanager/hooks/PreHook';
import createErrorResponseFromError from './createErrorResponseFromError';
import { HttpStatusCodes } from '../constants/constants';

export default function createErrorResponseFromErrorCodeMessageAndStatus(
  errorCodeMessageAndStatus: ErrorCodeAndMessageAndStatus
) {
  return createErrorResponseFromError(
    new Error(
      (errorCodeMessageAndStatus.statusCode ?? HttpStatusCodes.INTERNAL_SERVER_ERROR) +
        ':Error code ' +
        errorCodeMessageAndStatus.errorCode +
        ':' +
        errorCodeMessageAndStatus.errorMessage
    )
  );
}
