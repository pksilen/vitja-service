import { ErrorResponse, errorResponseSymbol } from "../types/ErrorResponse";
import fetch from "node-fetch";
import log from "../observability/logging/log";
import createErrorResponseFromError from "../errors/createErrorResponseFromError";
import isErrorResponse from "../errors/isErrorResponse";
import getRemoteResponseTestValue from "../metadata/getRemoteResponseTestValue";

export default async function call<T>(
  remoteServiceUrl: string,
  remoteServiceFunctionArgument: object,
  ResponseClass?: new () => T
): Promise<T | ErrorResponse> {
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.SHOULD_USE_FAKE_REMOTE_SERVICES_IN_TEST === 'true'
  ) {
    if (!ResponseClass) {
      throw new Error(
        'ResponseClass must be provided when environment variable SHOULD_USE_FAKE_REMOTE_SERVICES_IN_TEST is true'
      );
    }
    return getRemoteResponseTestValue(ResponseClass) as T;
  }

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
