import { HttpException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { createNamespace, getNamespace } from 'cls-hooked';
import _ from 'lodash';
import Redis from 'ioredis';
import tryAuthorize from '../authorization/tryAuthorize';
import BaseService from '../service/BaseService';
import tryVerifyCaptchaToken from '../captcha/tryVerifyCaptchaToken';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import UsersBaseService from '../users/UsersBaseService';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import tryValidateServiceFunctionArgument from '../validation/tryValidateServiceFunctionArgument';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import tryValidateServiceFunctionResponse from '../validation/tryValidateServiceFunctionResponse';
import isErrorResponse from '../errors/isErrorResponse';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import log, { Severity } from '../observability/logging/log';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { HttpStatusCodes, MAX_INT_VALUE } from '../constants/constants';
import getNamespacedServiceName from '../utils/getServiceNamespace';
import AuditLoggingService from '../observability/logging/audit/AuditLoggingService';
import createAuditLogEntry from '../observability/logging/audit/createAuditLogEntry';
import executeMultipleServiceFunctions from './executeMultipleServiceFunctions';
import tryScheduleJobExecution from '../scheduling/tryScheduleJobExecution';
import isExecuteMultipleRequest from './isExecuteMultipleRequest';
import createErrorFromErrorCodeMessageAndStatus from '../errors/createErrorFromErrorCodeMessageAndStatus';
import {
  BACKK_ERRORS_INVALID_ARGUMENT,
  BACKK_ERRORS_INVALID_HTTP_METHOD_MUST_BE_POST,
  BACKK_ERRORS_MISSING_ARGUMENT,
  BACKK_ERRORS_UNKNOWN_SERVICE,
  BACKK_ERRORS_UNKNOWN_SERVICE_FUNCTION
} from '../errors/backkErrors';

export interface ExecuteServiceFunctionOptions {
  httpMethod?: 'POST' | 'GET';
  allowedServiceFunctionsRegExpForHttpGetMethod?: RegExp;
  deniedServiceFunctionsForForHttpGetMethod?: string[];
  isMetadataServiceEnabled?: boolean;
  areMultipleServiceFunctionExecutionsAllowed?: boolean;
  maxServiceFunctionCountInMultipleServiceFunctionExecution?: number;
  shouldAllowTemplatesInMultipleServiceFunctionExecution?: boolean;
  allowedServiceFunctionsRegExpForRemoteServiceCalls?: RegExp;
}

export default async function tryExecuteServiceMethod(
  controller: any,
  serviceFunctionName: string,
  serviceFunctionArgument: any,
  headers: { [key: string]: string },
  resp?: any,
  options?: ExecuteServiceFunctionOptions,
  shouldCreateClsNamespace = true
): Promise<void | object> {
  if (options?.areMultipleServiceFunctionExecutionsAllowed && isExecuteMultipleRequest(serviceFunctionName)) {
    if (options?.maxServiceFunctionCountInMultipleServiceFunctionExecution) {
      if (
        Object.keys(serviceFunctionArgument).length >
        options?.maxServiceFunctionCountInMultipleServiceFunctionExecution
      ) {
        throw createErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS_INVALID_ARGUMENT,
          errorMessage: BACKK_ERRORS_INVALID_ARGUMENT + 'too many service functions called'
        });
      }
    } else {
      throw new Error('Missing maxServiceFunctionCountInMultipleServiceFunctionExecution option');
    }

    if (serviceFunctionName === 'executeMultipleInParallelWithoutTransaction') {
      return await executeMultipleServiceFunctions(
        true,
        false,
        controller,
        serviceFunctionArgument,
        headers,
        resp,
        options
      );
    } else if (serviceFunctionName === 'executeMultipleInSequenceWithoutTransaction') {
      return await executeMultipleServiceFunctions(
        false,
        false,
        controller,
        serviceFunctionArgument,
        headers,
        resp,
        options
      );
    } else if (serviceFunctionName === 'executeMultipleInParallelInsideTransaction') {
      return await executeMultipleServiceFunctions(
        true,
        true,
        controller,
        serviceFunctionArgument,
        headers,
        resp,
        options
      );
    } else if (serviceFunctionName === 'executeMultipleInSequenceInsideTransaction') {
      return executeMultipleServiceFunctions(
        false,
        true,
        controller,
        serviceFunctionArgument,
        headers,
        resp,
        options
      );
    }
  }

  const [serviceName, functionName] = serviceFunctionName.split('.');
  let response: any;
  let storedError;
  let userName;

  // noinspection ExceptionCaughtLocallyJS
  try {
    log(Severity.DEBUG, 'Service function call', serviceFunctionName);
    defaultServiceMetrics.incrementServiceFunctionCallsByOne(serviceFunctionName);

    const serviceFunctionCallStartTimeInMillis = Date.now();

    if (serviceFunctionName === 'scheduleJobExecution') {
      return await tryScheduleJobExecution(controller, serviceFunctionArgument, headers, resp);
    }

    if (options?.httpMethod === 'GET') {
      if (
        !serviceFunctionName.match(options?.allowedServiceFunctionsRegExpForHttpGetMethod ?? /^\w+\.get/) ||
        options?.deniedServiceFunctionsForForHttpGetMethod?.includes(serviceFunctionName)
      ) {
        throw createErrorFromErrorCodeMessageAndStatus(BACKK_ERRORS_INVALID_HTTP_METHOD_MUST_BE_POST);
      }

      // noinspection AssignmentToFunctionParameterJS
      serviceFunctionArgument = decodeURIComponent(serviceFunctionArgument);
      try {
        // noinspection AssignmentToFunctionParameterJS
        serviceFunctionArgument = JSON.parse(serviceFunctionArgument);
      } catch (error) {
        throw createErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS_INVALID_ARGUMENT,
          errorMessage:
            BACKK_ERRORS_INVALID_ARGUMENT +
            'nvalid or too long argument. Argument must be a URI encoded JSON string'
        });
      }
    }

    if (serviceFunctionName === 'metadataService.getServicesMetadata') {
      if (!options || options.isMetadataServiceEnabled === undefined || options.isMetadataServiceEnabled) {
        resp?.send(controller.publicServicesMetadata);
      } else {
        throw createErrorFromErrorCodeMessageAndStatus({
          ...BACKK_ERRORS_UNKNOWN_SERVICE,
          errorMessage: BACKK_ERRORS_UNKNOWN_SERVICE + serviceName
        });
      }
    } else if (serviceFunctionName === 'livenessCheckService.isAlive') {
      resp?.send();
    } else if (
      serviceFunctionName === 'readinessCheckService.isReady' &&
      (!controller[serviceName] || !controller[serviceName][functionName])
    ) {
      resp?.send();
    }

    if (!controller[serviceName]) {
      throw createErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS_UNKNOWN_SERVICE,
        errorMessage: BACKK_ERRORS_UNKNOWN_SERVICE + serviceName
      });
    }

    const serviceFunctionResponseValueTypeName =
      controller[`${serviceName}__BackkTypes__`].functionNameToReturnTypeNameMap[functionName];

    if (!controller[serviceName][functionName] || !serviceFunctionResponseValueTypeName) {
      throw createErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS_UNKNOWN_SERVICE_FUNCTION,
        errorMessage: BACKK_ERRORS_UNKNOWN_SERVICE_FUNCTION + serviceFunctionName
      });
    }

    const serviceFunctionArgumentTypeName =
      controller[`${serviceName}__BackkTypes__`].functionNameToParamTypeNameMap[functionName];

    if (
      typeof serviceFunctionArgument !== 'object' ||
      Array.isArray(serviceFunctionArgument) ||
      (serviceFunctionArgumentTypeName && serviceFunctionArgument === null)
    ) {
      throw createErrorFromErrorCodeMessageAndStatus({
        ...BACKK_ERRORS_INVALID_ARGUMENT,
        errorMessage: BACKK_ERRORS_INVALID_ARGUMENT + 'argument must be a JSON object'
      });
    }

    if (serviceFunctionArgument?.captchaToken) {
      await tryVerifyCaptchaToken(controller, serviceFunctionArgument.captchaToken);
    }

    const usersService = Object.values(controller).find((service) => service instanceof UsersBaseService);

    userName = await tryAuthorize(
      controller[serviceName],
      functionName,
      serviceFunctionArgument,
      headers.Authorization,
      controller['authorizationService'],
      usersService as UsersBaseService | undefined
    );

    const dbManager = (controller[serviceName] as BaseService).getDbManager();

    let instantiatedServiceFunctionArgument: any;
    if (serviceFunctionArgumentTypeName) {
      instantiatedServiceFunctionArgument = plainToClass(
        controller[serviceName]['Types'][serviceFunctionArgumentTypeName],
        serviceFunctionArgument
      );

      Object.entries(instantiatedServiceFunctionArgument).forEach(([propName, propValue]: [string, any]) => {
        if (Array.isArray(propValue) && propValue.length > 0) {
          instantiatedServiceFunctionArgument[propName] = propValue.map((pv) => {
            if (_.isPlainObject(pv)) {
              const serviceMetadata = controller.servicesMetadata.find(
                (serviceMetadata: ServiceMetadata) => serviceMetadata.serviceName === serviceName
              );

              const { baseTypeName } = getTypeInfoForTypeName(
                serviceMetadata.types[serviceFunctionArgumentTypeName][propName]
              );

              return plainToClass(controller[serviceName]['Types'][baseTypeName], pv);
            }
            return pv;
          });
        } else {
          if (_.isPlainObject(propValue)) {
            const serviceMetadata = controller.servicesMetadata.find(
              (serviceMetadata: ServiceMetadata) => serviceMetadata.serviceName === serviceName
            );

            const { baseTypeName } = getTypeInfoForTypeName(
              serviceMetadata.types[serviceFunctionArgumentTypeName][propName]
            );

            instantiatedServiceFunctionArgument[propName] = plainToClass(
              controller[serviceName]['Types'][baseTypeName],
              propValue
            );
          }
        }
      });

      if (!instantiatedServiceFunctionArgument) {
        throw createErrorFromErrorCodeMessageAndStatus(BACKK_ERRORS_MISSING_ARGUMENT);
      }

      await tryValidateServiceFunctionArgument(functionName, dbManager, instantiatedServiceFunctionArgument);
    }

    if (
      options?.httpMethod === 'GET' &&
      controller?.responseCacheConfigService.shouldCacheServiceFunctionCallResponse(
        serviceFunctionName,
        serviceFunctionArgument
      )
    ) {
      const key =
        'BackkResponseCache' +
        ':' +
        getNamespacedServiceName() +
        ':' +
        serviceFunctionName +
        ':' +
        JSON.stringify(serviceFunctionArgument);

      const redis = new Redis(`redis://${process.env.REDIS_SERVER}`);
      let cachedResponseJson;

      try {
        cachedResponseJson = await redis.get(key);
      } catch (error) {
        log(Severity.ERROR, 'Redis cache error: ' + error.message, error.stack, {
          redisServer: process.env.REDIS_SERVER
        });
      }

      if (cachedResponseJson) {
        log(Severity.DEBUG, 'Redis cache debug: fetched service function call response from cache', '', {
          redisServer: process.env.REDIS_SERVER,
          key
        });

        defaultServiceMetrics.incrementServiceFunctionCallCacheHitCounterByOne(serviceFunctionName);

        try {
          response = JSON.parse(cachedResponseJson);
        } catch {
          // No operation
        }
      }
    }

    let ttl;

    if (!response) {
      if (instantiatedServiceFunctionArgument) {
        instantiatedServiceFunctionArgument.ETag = headers['X-Backk-ETag'];
      }

      const clsNamespace = shouldCreateClsNamespace
        ? createNamespace('serviceFunctionExecution')
        : getNamespace('serviceFunctionExecution')!;

      response = await clsNamespace.runAndReturn(async () => {
        clsNamespace.set('authHeader', headers.Authorization);
        clsNamespace.set('dbLocalTransactionCount', 0);
        clsNamespace.set('remoteServiceCallCount', 0);
        clsNamespace.set('postHookRemoteServiceCallCount', 0);
        clsNamespace.set('dbManagerOperationAfterRemoteServiceCall', false);
        let response;

        // noinspection ExceptionCaughtLocallyJS
        try {
          if (dbManager) {
            await dbManager.tryReserveDbConnectionFromPool();
          }

          response = await controller[serviceName][functionName](instantiatedServiceFunctionArgument);

          if (dbManager) {
            dbManager.tryReleaseDbConnectionBackToPool();
          }

          if (
            clsNamespace.get('dbLocalTransactionCount') > 1 &&
            clsNamespace.get('remoteServiceCallCount') === 0 &&
            !serviceFunctionAnnotationContainer.isServiceFunctionNonTransactional(
              controller[serviceName].constructor,
              functionName
            )
          ) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              serviceFunctionName +
                ": multiple database manager operations must be executed inside a transaction (use database manager's executeInsideTransaction method) or service function must be annotated with @NoTransaction"
            );
          } else if (
            clsNamespace.get('dbLocalTransactionCount') >= 1 &&
            clsNamespace.get('remoteServiceCallCount') === 1 &&
            !serviceFunctionAnnotationContainer.isServiceFunctionNonTransactional(
              controller[serviceName].constructor,
              functionName
            )
          ) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              serviceFunctionName +
                ': database manager operation and remote service callRemoteService must be executed inside a transaction or service function must be annotated with @NoTransaction if no transaction is needed'
            );
          } else if (
            (clsNamespace.get('remoteServiceCallCount') > 1 ||
              clsNamespace.get('postHookRemoteServiceCallCount') > 1) &&
            !serviceFunctionAnnotationContainer.isServiceFunctionNonDistributedTransactional(
              controller[serviceName].constructor,
              functionName
            )
          ) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              serviceFunctionName +
                ": multiple remote service calls cannot be executed because distributed transactions are not supported. To allow multiple remote service calls that don't require a transaction, annotate service function with @NoDistributedTransaction"
            );
          } else if (
            clsNamespace.get('dbManagerOperationAfterRemoteServiceCall') &&
            !serviceFunctionAnnotationContainer.isServiceFunctionNonDistributedTransactional(
              controller[serviceName].constructor,
              functionName
            )
          ) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              serviceFunctionName +
                ': database manager operation(s) that can fail cannot be called after a remote service callRemoteService that cannot be rolled back. Alternatively, service function must be annotated with @NoDistributedTransaction if no distributed transaction is needed'
            );
          }
        } catch (error) {
          response = createErrorResponseFromError(error);
        }

        return response;
      });

      if (isErrorResponse(response)) {
        if (response.statusCode >= HttpStatusCodes.INTERNAL_SERVER_ERROR) {
          defaultServiceMetrics.incrementHttp5xxErrorsByOne();
        } else if (response.statusCode >= HttpStatusCodes.CLIENT_ERRORS_START) {
          defaultServiceMetrics.incrementHttpClientErrorCounter(serviceFunctionName);
        }
        // noinspection ExceptionCaughtLocallyJS
        throw new HttpException(response, response.statusCode);
      }

      if (response !== undefined) {
        const serviceFunctionBaseReturnTypeName = getTypeInfoForTypeName(
          controller[`${serviceName}__BackkTypes__`].functionNameToReturnTypeNameMap[functionName]
        ).baseTypeName;

        const ServiceFunctionReturnType = controller[serviceName]['Types'][serviceFunctionBaseReturnTypeName];

        if (Array.isArray(response) && response.length > 0 && typeof response[0] === 'object') {
          await tryValidateServiceFunctionResponse(
            response[0],
            ServiceFunctionReturnType,
            serviceFunctionName
          );
        } else if (typeof response === 'object') {
          await tryValidateServiceFunctionResponse(response, ServiceFunctionReturnType, serviceFunctionName);
        }

        if (
          options?.httpMethod === 'GET' &&
          controller?.responseCacheConfigService.shouldCacheServiceFunctionCallResponse(
            serviceFunctionName,
            serviceFunctionArgument
          )
        ) {
          const redis = new Redis(`redis://${process.env.REDIS_SERVER}`);
          const responseJson = JSON.stringify(response);
          const key =
            'BackkResponseCache' +
            ':' +
            getNamespacedServiceName() +
            ':' +
            serviceFunctionName +
            ':' +
            JSON.stringify(serviceFunctionArgument);

          try {
            ttl = await redis.ttl(key);
            await redis.set(key, responseJson);

            log(Severity.DEBUG, 'Redis cache debug: stored service function call response to cache', '', {
              redisUrl: process.env.REDIS_SERVER,
              key
            });

            defaultServiceMetrics.incrementServiceFunctionCallCachedResponsesCounterByOne(serviceName);

            if (ttl < 0) {
              ttl = controller?.responseCacheConfigService.getCachingDurationInSecs(
                serviceFunctionName,
                serviceFunctionArgument
              );

              await redis.expire(key, ttl);
            }
          } catch (error) {
            log(
              Severity.ERROR,
              'Redis cache errorMessageOnPreHookFuncExecFailure: ' + error.message,
              error.stack,
              {
                redisUrl: process.env.REDIS_SERVER
              }
            );
          }
        }

        if (response.version) {
          if (response.version === headers['If-None-Match']) {
            response = undefined;
            resp?.status(HttpStatusCodes.NOT_MODIFIED);
          }

          if (typeof resp?.header === 'function') {
            resp?.header('ETag', response.version);
          } else if (typeof resp?.set === 'function') {
            resp?.set('ETag', response.version);
          }
        }
      }
    }

    const serviceFunctionProcessingTimeInMillis = Date.now() - serviceFunctionCallStartTimeInMillis;
    defaultServiceMetrics.incrementServiceFunctionProcessingTimeInSecsBucketCounterByOne(
      serviceFunctionName,
      serviceFunctionProcessingTimeInMillis / 1000
    );

    if (ttl) {
      if (typeof resp?.header === 'function') {
        resp?.header('Cache-Control', 'max-age=' + ttl);
      } else if (typeof resp?.set === 'function') {
        resp?.set('Cache-Control', 'max-age=' + ttl);
      }
    }

    if (typeof resp?.header === 'function') {
      resp?.header('X-content-type-options', 'nosniff');
      resp?.header('Strict-Transport-Security', 'max-age=' + MAX_INT_VALUE + '; includeSubDomains');
    } else if (typeof resp?.set === 'function') {
      resp?.set('X-content-type-options', 'nosniff');
      resp?.set('Strict-Transport-Security', 'max-age=' + MAX_INT_VALUE + '; includeSubDomains');
    }

    Object.entries(
      serviceFunctionAnnotationContainer.getResponseHeadersForServiceFunction(
        controller[serviceName].constructor,
        functionName
      ) || {}
    ).forEach(([headerName, headerValueOrGenerator]) => {
      if (typeof headerValueOrGenerator === 'string') {
        if (typeof resp?.header === 'function') {
          resp.header(headerName, headerValueOrGenerator);
        } else if (typeof resp?.set === 'function') {
          resp.set(headerName, headerValueOrGenerator);
        }
      } else if (typeof headerValueOrGenerator === 'function') {
        const headerValue = headerValueOrGenerator(serviceFunctionArgument, response);
        if (headerValue !== undefined) {
          if (typeof resp?.header === 'function') {
            resp.header(headerName, headerValue);
          } else if (typeof resp?.set === 'function') {
            resp.set(headerName, headerValue);
          }
        }
      }
    });

    resp?.status(HttpStatusCodes.SUCCESS);
    resp?.send(response);
  } catch (error) {
    storedError = error;
    if (resp && error instanceof HttpException) {
      resp.status(error.getStatus());
      resp.send(error.getResponse());
    } else {
      throw error;
    }
  } finally {
    if (controller[serviceName] instanceof UsersBaseService || userName) {
      const auditLogEntry = createAuditLogEntry(
        userName ?? serviceFunctionArgument?.userName ?? '',
        headers['X-Forwarded-For'] ?? '',
        headers.Authorization,
        controller[serviceName] instanceof UsersBaseService ? functionName : serviceFunctionName,
        storedError ? 'failure' : 'success',
        storedError?.getStatus(),
        storedError?.getResponse().errorMessage,
        controller[serviceName] instanceof UsersBaseService ? serviceFunctionArgument : { _id: response._id }
      );
      await (controller?.auditLoggingService as AuditLoggingService).log(auditLogEntry);
    }
  }
}
