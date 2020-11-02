import { ErrorResponse, errorResponseSymbol } from '../types/ErrorResponse';

export default function createErrorResponseFromError(error: Error): ErrorResponse {
  let statusCode = parseInt(error.message.slice(0, 3));
  let errorMessage = error.message.slice(4);

  if (isNaN(statusCode)) {
    statusCode = 500;
    errorMessage = error.message;
  }

  if (statusCode >= 500) {
    console.log(error.stack);
  }

  let errorCode;
  if (errorMessage.startsWith('Error code ')) {
    [errorCode, errorMessage] = errorMessage.split(':');
    errorCode = errorCode.slice(11);
    errorMessage = errorMessage.trim();
  }

  return {
    statusCode,
    errorCode,
    errorMessage,
    [errorResponseSymbol]: true,
    stackTrace: process.env.LOG_LEVEL === 'DEBUG' && statusCode === 500 ? error.stack : undefined
  };
}