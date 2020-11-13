import { ErrorResponse, errorResponseSymbol } from '../types/ErrorResponse';
import log, { Severity } from '../observability/logging/log';

export default function createErrorResponseFromError(error: Error): ErrorResponse {
  let statusCode = parseInt(error.message.slice(0, 3));
  let errorMessage = error.message.slice(4);

  if (isNaN(statusCode)) {
    statusCode = 500;
    errorMessage = error.message;
  }

  let errorCode;
  let errorMessagePrefix;
  if (errorMessage.startsWith('Error code ')) {
    [errorCode, errorMessagePrefix, errorMessage] = errorMessage.split(':');
    errorCode = errorCode.slice(11);
    errorMessage = `${errorMessagePrefix ? errorMessagePrefix + ':' : ''}${errorMessage}`;
    errorMessage = errorMessage.trim();
  }

  if (process.env.NODE_ENV === 'development') {
    log(Severity.DEBUG, errorMessage, error.stack ?? '', { errorCode, statusCode });
  }

  return {
    statusCode,
    errorCode,
    errorMessage,
    [errorResponseSymbol]: true,
    stackTrace:
      (process.env.LOG_LEVEL === 'DEBUG' || process.env.NODE_ENV === 'development') && statusCode === 500
        ? error.stack
        : undefined
  };
}
