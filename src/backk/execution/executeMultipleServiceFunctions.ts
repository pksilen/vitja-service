import Mustache from 'mustache';
import tryExecuteServiceMethod, { ExecuteServiceFunctionOptions } from './tryExecuteServiceMethod';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { ServiceFunctionCall } from './ServiceFunctionCall';
import { ServiceFunctionCallResponse } from './ServiceFunctionCallResponse';
import Response from './Response';
import forEachAsyncSequential from '../utils/forEachAsyncSequential';
import { createNamespace } from 'cls-hooked';
import BaseService from '../service/BaseService';
import isValidServiceFunctionName from './isValidServiceFunctionName';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../constants/constants';
import { ErrorResponse } from '../types/ErrorResponse';
import isErrorResponse from '../errors/isErrorResponse';
import createErrorResponseFromErrorMessageAndStatusCode from '../errors/createErrorResponseFromErrorMessageAndStatusCode';
import callRemoteService from '../remote/http/callRemoteService';
import {
  BACKK_ERRORS_ALLOWED_REMOTE_SERVICE_FUNCTIONS_REGEXP_PATTERN_NOT_DEFINED,
  BACKK_ERRORS_REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED,
  BACKK_ERRORS_REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED_INSIDE_TRANSACTION
} from "../errors/backkErrors";
import createErrorResponseFromErrorCodeMessageAndStatus from '../errors/createErrorResponseFromErrorCodeMessageAndStatus';

async function executeMultiple<T>(
  isConcurrent: boolean,
  serviceFunctionArgument: object,
  controller: any,
  headers: { [p: string]: string },
  options: ExecuteServiceFunctionOptions | undefined,
  serviceFunctionCallIdToResponseMap: { [p: string]: ServiceFunctionCallResponse },
  statusCodes: number[],
  isTransactional = false
) {
  const forEachFunc = isConcurrent ? forEachAsyncParallel : forEachAsyncSequential;
  let possibleErrorResponse: ErrorResponse | undefined;

  await forEachFunc(
    Object.entries(serviceFunctionArgument),
    async ([serviceFunctionCallId, { localOrRemoteServiceFunctionName, serviceFunctionArgument }]: [
      string,
      ServiceFunctionCall
    ]) => {
      if (possibleErrorResponse) {
        return;
      }

      const response = new Response();

      let renderedServiceFunctionArgument = serviceFunctionArgument;
      if ((options?.shouldAllowTemplatesInMultipleServiceFunctionExecution && !isConcurrent) ?? false) {
        renderedServiceFunctionArgument = Mustache.render(
          JSON.stringify(serviceFunctionArgument),
          serviceFunctionCallIdToResponseMap
        );
        renderedServiceFunctionArgument = JSON.parse(renderedServiceFunctionArgument);
      }

      if (localOrRemoteServiceFunctionName.includes('/')) {
        if (isTransactional) {
          response.send(
            createErrorResponseFromErrorCodeMessageAndStatus(
              BACKK_ERRORS_REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED_INSIDE_TRANSACTION
            )
          );

          response.status(HttpStatusCodes.BAD_REQUEST);
        } else if (!options?.allowedServiceFunctionsRegExpForRemoteServiceCalls) {
          response.send(
            createErrorResponseFromErrorCodeMessageAndStatus(
             BACKK_ERRORS_ALLOWED_REMOTE_SERVICE_FUNCTIONS_REGEXP_PATTERN_NOT_DEFINED
            )
          );

          response.status(HttpStatusCodes.BAD_REQUEST);
        } else if (
          !localOrRemoteServiceFunctionName.match(options.allowedServiceFunctionsRegExpForRemoteServiceCalls)
        ) {
          response.send(
            createErrorResponseFromErrorCodeMessageAndStatus(
              BACKK_ERRORS_REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED
            )
          );
          response.status(HttpStatusCodes.BAD_REQUEST);
        } else {
          const [serviceHost, serviceFunctionName] = localOrRemoteServiceFunctionName.split('/');

          const remoteServiceCallResponse = await callRemoteService(
            `http://${serviceHost}.svc.cluster.local/${serviceFunctionName}`
          );

          response.send(remoteServiceCallResponse);

          response.status(
            'errorMessage' in remoteServiceCallResponse
              ? remoteServiceCallResponse.statusCode
              : HttpStatusCodes.SUCCESS
          );
        }
      } else {
        await tryExecuteServiceMethod(
          controller,
          localOrRemoteServiceFunctionName,
          renderedServiceFunctionArgument,
          headers,
          response,
          options,
          false
        );
      }

      serviceFunctionCallIdToResponseMap[serviceFunctionCallId] = {
        statusCode: response.getStatusCode(),
        response: response.getResponse()
      };

      if (isErrorResponse(response.getResponse())) {
        possibleErrorResponse = response.getResponse() as ErrorResponse;
      }

      statusCodes.push(response.getStatusCode());
    }
  );
}

export default async function executeMultipleServiceFunctions(
  isConcurrent: boolean,
  shouldExecuteInsideTransaction: boolean,
  controller: any,
  serviceFunctionCalls: object,
  headers: { [key: string]: string },
  resp?: any,
  options?: ExecuteServiceFunctionOptions
): Promise<void | object> {
  const areServiceFunctionCallsValid = Object.values(serviceFunctionCalls).reduce(
    (areCallsValid, serviceFunctionCall) =>
      areCallsValid &&
      typeof serviceFunctionCall.serviceFunctionName === 'string' &&
      isValidServiceFunctionName(serviceFunctionCall.serviceFunctionName, controller) &&
      (serviceFunctionCall.serviceFunctionArgument === undefined ||
        typeof serviceFunctionCall.serviceFunctionArgument === 'object') &&
      !Array.isArray(serviceFunctionCall.serviceFunctionArgument),
    true
  );

  if (!areServiceFunctionCallsValid) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(
        'One or more invalid service function calls',
        HttpStatusCodes.BAD_REQUEST
      )
    );
  }

  const serviceFunctionCallIdToResponseMap: { [key: string]: ServiceFunctionCallResponse } = {};
  const statusCodes: number[] = [];
  const services = Object.values(controller).filter((service) => service instanceof BaseService);
  const dbManager = (services as BaseService[])[0].getDbManager();

  const clsNamespace = createNamespace('multipleServiceFunctionExecutions');
  const clsNamespace2 = createNamespace('serviceFunctionExecution');
  await clsNamespace.runAndReturn(async () => {
    await clsNamespace2.runAndReturn(async () => {
      await dbManager.tryReserveDbConnectionFromPool();
      clsNamespace.set('connection', true);

      if (shouldExecuteInsideTransaction) {
        await dbManager.executeInsideTransaction(async () => {
          clsNamespace.set('globalTransaction', true);
          const response = await executeMultiple(
            isConcurrent,
            serviceFunctionCalls,
            controller,
            headers,
            options,
            serviceFunctionCallIdToResponseMap,
            statusCodes,
            true
          );
          clsNamespace.set('globalTransaction', false);
          return response;
        });
      } else {
        clsNamespace.set('globalTransaction', true);
        await executeMultiple(
          isConcurrent,
          serviceFunctionCalls,
          controller,
          headers,
          options,
          serviceFunctionCallIdToResponseMap,
          statusCodes
        );
        clsNamespace.set('globalTransaction', false);
      }

      dbManager.tryReleaseDbConnectionBackToPool();
      clsNamespace.set('connection', false);
    });
  });

  resp.status(Math.max(...statusCodes));
  resp.send(serviceFunctionCallIdToResponseMap);
}
