import { BackkError, errorResponseSymbol } from '../../types/BackkError';
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
} from '../utils/validateServiceFunctionArguments';
import parseRemoteServiceFunctionCallUrlParts from '../utils/parseRemoteServiceFunctionCallUrlParts';
import fs from 'fs';

export interface HttpRequestOptions {
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export default async function callRemoteService(
  remoteServiceFunctionUrl: string,
  serviceFunctionArgument?: object,
  options?: HttpRequestOptions
): Promise<objec[T, BackkError | null]> {
  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('remoteServiceCallCount', clsNamespace?.get('remoteServiceCallCount') + 1);

  log(Severity.DEBUG, 'Call sync remote service', '', { remoteServiceFunctionUrl });
  defaultServiceMetrics.incrementRemoteServiceCallCountByOne(remoteServiceFunctionUrl);

  if (process.env.NODE_ENV === 'development') {
    await validateServiceFunctionArguments([{ remoteServiceFunctionUrl, serviceFunctionArgument }]);
    const { topic, serviceFunctionName } = parseRemoteServiceFunctionCallUrlParts(remoteServiceFunctionUrl);

    if (fs.existsSync('../' + topic) || fs.existsSync('./' + topic)) {
      const [serviceName, functionName] = serviceFunctionName.split('.');
      const controller = remoteServiceNameToControllerMap[`${topic}$/${serviceName}`];
      const responseClassName =
        controller[`${serviceName}__BackkTypes__`].functionNameToReturnTypeNameMap[functionName];
      const ResponseClass = controller[serviceName].Types[responseClassName];
      return getRemoteResponseTestValue(ResponseClass);
    }
  }

  const authHeader = getNamespace('serviceFunctionExecution')?.get('authHeader');

  try {
    const response = await fetch(remoteServiceFunctionUrl, {
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
          remoteServiceFunctionCallUrl: remoteServiceFunctionUrl
        });
        defaultServiceMetrics.incrementSyncRemoteServiceHttp5xxErrorResponseCounter(remoteServiceFunctionUrl);
      } else {
        log(Severity.DEBUG, errorMessage, stackTrace, {
          errorCode,
          statusCode: response.status,
          remoteServiceFunctionCallUrl: remoteServiceFunctionUrl
        });

        if (response.status === HttpStatusCodes.FORBIDDEN) {
          defaultServiceMetrics.incrementSyncRemoteServiceCallAuthFailureCounter(remoteServiceFunctionUrl);
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
    log(Severity.ERROR, error.message, error.stack, {
      remoteServiceFunctionCallUrl: remoteServiceFunctionUrl
    });
    defaultServiceMetrics.incrementRemoteServiceCallErrorCountByOne(remoteServiceFunctionUrl);
    return createErrorResponseFromError(error);
  }
}
