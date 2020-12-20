import { ErrorResponse, errorResponseSymbol } from '../../types/ErrorResponse';
import fetch from 'node-fetch';
import log, { Severity } from '../../observability/logging/log';
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import isErrorResponse from '../../errors/isErrorResponse';
import getRemoteResponseTestValue from './getRemoteResponseTestValue';
import { getNamespace } from 'cls-hooked';
import defaultServiceMetrics from '../../observability/metrics/defaultServiceMetrics';
import { HttpStatusCodes } from '../../constants/constants';
import {
  remoteServiceNameToControllerMap,
  validateServiceFunctionArguments
} from "../utils/validateServiceFunctionArguments";
import parseRemoteServiceFunctionCallUrlParts from "../utils/parseRemoteServiceFunctionCallUrlParts";

export interface HttpRequestOptions {
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export default async function callRemoteService<T>(
  serviceFunctionCallUrl: string,
  serviceFunctionArgument?: object,
  options?: HttpRequestOptions
): Promise<T | ErrorResponse> {
  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('remoteServiceCallCount', clsNamespace?.get('remoteServiceCallCount') + 1);

  log(Severity.DEBUG, 'Call sync remote service', '', { serviceFunctionCallUrl });
  defaultServiceMetrics.incrementRemoteServiceCallCountByOne(serviceFunctionCallUrl);

  if (process.env.NODE_ENV === 'development') {
    await validateServiceFunctionArguments([{ remoteServiceFunctionUrl: serviceFunctionCallUrl, serviceFunctionArgument }]);
    const { serviceFunctionName } = parseRemoteServiceFunctionCallUrlParts(serviceFunctionCallUrl);
    const [serviceName, functionName] = serviceFunctionName.split('.');
    const controller = remoteServiceNameToControllerMap[serviceName];
    const responseClassName = controller[`${serviceName}Types`].functionNameToReturnTypeNameMap[functionName];
    const ResponseClass = controller[serviceName].Types[responseClassName];
    return getRemoteResponseTestValue(ResponseClass) as T;
  }

  const authHeader = getNamespace('serviceFunctionExecution')?.get('authHeader');

  try {
    const response = await fetch(serviceFunctionCallUrl, {
      method: options?.httpMethod?.toLowerCase() ?? 'post',
      body: serviceFunctionArgument ? JSON.stringify(serviceFunctionArgument) : undefined,
      headers: {
        ...(serviceFunctionArgument ? { 'Content-Type': 'application/json' } : {}),
        Authorization: authHeader
      }
    });

    const responseBody = response.size > 0 ? await response.json() : undefined;

    if (response.status >= HttpStatusCodes.ERRORS_START) {
      const errorMessage = isErrorResponse(responseBody)
        ? responseBody.errorMessage
        : JSON.stringify(responseBody);
      const stackTrace = isErrorResponse(responseBody) ? responseBody.stackTrace : '';
      const errorCode = isErrorResponse(responseBody) ? responseBody.errorCode : undefined;

      if (response.status >= HttpStatusCodes.INTERNAL_SERVER_ERROR) {
        log(Severity.ERROR, errorMessage, stackTrace, {
          errorCode,
          statusCode: response.status,
          remoteServiceFunctionCallUrl: serviceFunctionCallUrl
        });
        defaultServiceMetrics.incrementSyncRemoteServiceHttp5xxErrorResponseCounter(serviceFunctionCallUrl);
      } else {
        log(Severity.DEBUG, errorMessage, stackTrace, {
          errorCode,
          statusCode: response.status,
          remoteServiceFunctionCallUrl: serviceFunctionCallUrl
        });

        if (response.status === HttpStatusCodes.FORBIDDEN) {
          defaultServiceMetrics.incrementSyncRemoteServiceCallAuthFailureCounter(serviceFunctionCallUrl);
        }
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
    log(Severity.ERROR, error.message, error.stack, { remoteServiceFunctionCallUrl: serviceFunctionCallUrl });
    defaultServiceMetrics.incrementRemoteServiceCallErrorCountByOne(serviceFunctionCallUrl);
    return createErrorResponseFromError(error);
  }
}
