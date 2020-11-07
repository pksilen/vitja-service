import { ErrorResponse, errorResponseSymbol } from '../../types/ErrorResponse';
import fetch from 'node-fetch';
import log, { Severity } from "../../observability/logging/log";
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import isErrorResponse from '../../errors/isErrorResponse';
import getRemoteResponseTestValue from '../../metadata/getRemoteResponseTestValue';

export interface HttpRequestOptions {
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export default async function call<T>(
  remoteServiceFunctionCallUrl: string,
  serviceFunctionArgument?: object,
  options?: HttpRequestOptions,
  ResponseClass?: new () => T
): Promise<T | ErrorResponse> {
  log(Severity.DEBUG, 'Call sync remote service', '', { remoteServiceFunctionCallUrl });
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
    const response = await fetch(remoteServiceFunctionCallUrl, {
      method: options?.httpMethod?.toLowerCase() ?? 'post',
      body: serviceFunctionArgument ? JSON.stringify(serviceFunctionArgument) : undefined,
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
        log(Severity.ERROR, errorMessage, stackTrace, {
          errorCode,
          statusCode: response.status,
          remoteServiceFunctionCallUrl
        });
      } else {
        log(Severity.DEBUG, errorMessage, stackTrace, {
          errorCode,
          statusCode: response.status,
          remoteServiceFunctionCallUrl
        });
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
    log(Severity.ERROR, error.message, error.stack, { remoteServiceFunctionCallUrl });
    return createErrorResponseFromError(error);
  }
}
