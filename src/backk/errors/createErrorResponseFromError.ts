import { BackkError, errorResponseSymbol } from '../types/BackkError';
import log, { Severity } from '../observability/logging/log';

export default function createErrorResponseFromError(error: Error): BackkError {
  let statusCode = parseInt(error.message.slice(0, 3));
  let errorMessage = error.message.slice(4);

  if (isNaN(statusCode)) {
    statusCode = 500;
    errorMessage = error.message;
  }

  let errorCode;
  if (errorMessage.startsWith('Error code ')) {
    const [errorCodeStr, ...errorMessageParts] = errorMessage.split(':');
    errorCode = errorCodeStr.slice(11);
    errorMessage = errorMessageParts.join(':').trim();
  }

  log(Severity.DEBUG, errorMessage, error.stack ?? '', { errorCode, statusCode });

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
