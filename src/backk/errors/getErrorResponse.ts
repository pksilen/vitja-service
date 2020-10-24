import { ErrorResponse, errorResponseSymbol } from '../types/ErrorResponse';

export default function getErrorResponse(error: Error): ErrorResponse {
  let statusCode = parseInt(error.message.slice(0, 3));
  let errorMessage = error.message.slice(4);

  if (isNaN(statusCode)) {
    statusCode = 500;
    errorMessage = error.message;
  }

  return {
    statusCode,
    errorMessage,
    [errorResponseSymbol]: true,
    stackTrace: process.env.LOG_LEVEL === 'DEBUG' ? error.stack : undefined
  };
}
