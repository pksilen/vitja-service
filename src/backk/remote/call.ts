import { ErrorResponse, errorResponseSymbol } from '../types/ErrorResponse';
import fetch from 'node-fetch';
import log from '../observability/logging/log';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import isErrorResponse from '../errors/isErrorResponse';

export default async function call<T>(
  remoteServiceUrl: string,
  remoteServiceFunctionArgument: object
): Promise<T | ErrorResponse> {
  try {
    const response = await fetch(remoteServiceUrl, {
      method: 'post',
      body: JSON.stringify(remoteServiceFunctionArgument),
      headers: { 'Content-Type': 'application/json' }
      // TODO add auth header
    });

    const responseBody = await response.json();

    if (response.status >= 300) {
      const errorMessage = isErrorResponse(responseBody)
        ? responseBody.errorMessage
        : JSON.stringify(responseBody);
      const stackTrace = isErrorResponse(responseBody) ? responseBody.stackTrace : '';
      const errorCode = isErrorResponse(responseBody) ? responseBody.errorCode : undefined;

      if (response.status >= 500) {
        log('ERROR', errorMessage, stackTrace, { errorCode, statusCode: response.status });
      } else {
        log('DEBUG', errorMessage, stackTrace, { errorCode, statusCode: response.status });
      }

      return isErrorResponse(responseBody)
        ? responseBody
        : {
            errorCode,
            errorMessage,
            stackTrace,
            [errorResponseSymbol]: true,
            statusCode: response.status
          };
    }

    return responseBody;
  } catch (error) {
    log('ERROR', error.message, error.stack);
    return createErrorResponseFromError(error);
  }
}
