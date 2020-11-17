import { HttpException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { createNamespace, getNamespace } from "cls-hooked";
import _ from 'lodash';
import Redis from 'ioredis';
import tryAuthorize from '../authorization/tryAuthorize';
import BaseService from '../service/BaseService';
import tryVerifyCaptchaToken from '../captcha/tryVerifyCaptchaToken';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import UsersBaseService from '../users/UsersBaseService';
import { ServiceMetadata } from '../metadata/ServiceMetadata';
import tryValidateObject from '../validation/tryValidateObject';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import tryValidateResponse from '../validation/tryValidateResponse';
import isErrorResponse from '../errors/isErrorResponse';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import log, { Severity } from '../observability/logging/log';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { HttpStatusCodes } from '../constants/constants';
import getNamespacedServiceName from '../utils/getServiceNamespace';
import AuditLoggingService from '../observability/logging/audit/AuditLoggingService';
import createAuditLogEntry from '../observability/logging/audit/createAuditLogEntry';
import executeMultipleServiceFunctions from './executeMultipleServiceFunctions';
import PartialResponse from "./PartialResponse";

export interface ExecuteServiceFunctionOptions {
  httpMethod?: 'POST' | 'GET';
  allowedServiceFunctionsRegExpForHttpGetMethod?: RegExp;
  deniedServiceFunctionsForForHttpGetMethod?: string[];
  isMetadataServiceEnabled?: boolean;
}

export default async function tryExecuteServiceFunction(
  controller: any,
  serviceFunction: string,
  serviceFunctionArgument: any,
  headers: { [key: string]: string },
  resp?: any,
  options?: ExecuteServiceFunctionOptions
): Promise<void | object> {
  if (serviceFunction === 'executeAllInParallelWithoutTransaction') {
    return executeMultipleServiceFunctions(
      true,
      false,
      controller,
      serviceFunctionArgument,
      headers,
      resp,
      options
    );
  } else if (serviceFunction === 'executeAllInSequenceWithoutTransaction') {
    return executeMultipleServiceFunctions(
      false,
      false,
      controller,
      serviceFunctionArgument,
      headers,
      resp,
      options
    );
  } else if (serviceFunction === 'executeAllInParallelInsideTransaction') {
    return executeMultipleServiceFunctions(
      true,
      true,
      controller,
      serviceFunctionArgument,
      headers,
      resp,
      options
    );
  } else if (serviceFunction === 'executeAllInSequenceInsideTransaction') {
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

  const [serviceName, functionName] = serviceFunction.split('.');
  let response;
  let storedError;
  let userName;

  // noinspection ExceptionCaughtLocallyJS
  try {
    log(Severity.DEBUG, 'Service function call', serviceFunction);
    defaultServiceMetrics.incrementServiceFunctionCallsByOne(serviceFunction);

    const serviceFunctionCallStartTimeInMillis = Date.now();

    if (options?.httpMethod === 'GET') {
      if (
        !serviceFunction.match(options?.allowedServiceFunctionsRegExpForHttpGetMethod ?? /^\w+\.get/) ||
        options?.deniedServiceFunctionsForForHttpGetMethod?.includes(serviceFunction)
      ) {
        createErrorFromErrorMessageAndThrowError(
          createErrorMessageWithStatusCode(
            'Service function cannot be called with HTTP GET. Use HTTP POST instead',
            HttpStatusCodes.BAD_REQUEST
          )
        );
      }

      // noinspection AssignmentToFunctionParameterJS
      serviceFunctionArgument = decodeURIComponent(serviceFunctionArgument);
      try {
        // noinspection AssignmentToFunctionParameterJS
        serviceFunctionArgument = JSON.parse(serviceFunctionArgument);
      } catch (error) {
        createErrorFromErrorMessageAndThrowError(
          createErrorMessageWithStatusCode(
            'Invalid or too long service function argument. Argument must be a URI encoded JSON object string',
            HttpStatusCodes.BAD_REQUEST
          )
        );
      }
    }

    if (serviceFunction === 'metadataService.getServicesMetadata') {
      if (!options || options.isMetadataServiceEnabled === undefined || options.isMetadataServiceEnabled) {
        resp?.send(controller.servicesMetadata);
      }
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, HttpStatusCodes.BAD_REQUEST)
      );
    } else if (serviceFunction === 'livenessCheckService.isAlive') {
      resp?.send();
    } else if (
      serviceFunction === 'readinessCheckService.isReady' &&
      (!controller[serviceName] || !controller[serviceName][functionName])
    ) {
      resp?.send();
    }

    if (!controller[serviceName]) {
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, HttpStatusCodes.BAD_REQUEST)
      );
    }

    if (!controller[serviceName][functionName]) {
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode(
          `Unknown function: ${serviceName}.${functionName}`,
          HttpStatusCodes.BAD_REQUEST
        )
      );
    }

    if (typeof serviceFunctionArgument !== 'object' || Array.isArray(serviceFunctionArgument)) {
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode(
          `Invalid service function argument. Argument must be a JSON object string`,
          HttpStatusCodes.BAD_REQUEST
        )
      );
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

    const serviceFunctionArgumentTypeName =
      controller[`${serviceName}Types`].functionNameToParamTypeNameMap[functionName];

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
        createErrorFromErrorMessageAndThrowError(
          createErrorMessageWithStatusCode('Missing service function argument', HttpStatusCodes.BAD_REQUEST)
        );
      }

      await tryValidateObject(instantiatedServiceFunctionArgument);
    }

    if (
      options?.httpMethod === 'GET' &&
      controller?.responseCacheConfigService.shouldCacheServiceFunctionCallResponse(
        serviceFunction,
        serviceFunctionArgument
      )
    ) {
      const key = getNamespacedServiceName() + ':' + serviceFunction;
      const redis = new Redis(controller?.responseCacheConfigService.getRedisUrl());
      let cachedResponseJson;
      try {
        cachedResponseJson = await redis.hget(key, JSON.stringify(serviceFunctionArgument));
      } catch (error) {
        log(Severity.ERROR, 'Failed to access Redis cache', error.message, {
          redisUrl: controller?.responseCacheConfigService.getRedisUrl()
        });
      }
      if (cachedResponseJson) {
        log(Severity.DEBUG, 'Fetched service function call response from Redis cache', '', {
          redisUrl: controller?.responseCacheConfigService.getRedisUrl(),
          key
        });
        defaultServiceMetrics.incrementServiceFunctionCallCacheHitCounterByOne(serviceFunction);

        try {
          response = JSON.parse(cachedResponseJson);
        } catch {
          // NOOP
        }
      }
    }

    let ttl;

    if (!response) {
      const dbManager = (controller[serviceName] as BaseService).getDbManager();
      const clsNamespace = createNamespace('serviceFunctionExecution');
      response = await clsNamespace.runAndReturn(async () => {
        clsNamespace.set('authHeader', headers.Authorization);
        clsNamespace.set('dbLocalTransactionCount', 0);
        clsNamespace.set('remoteServiceCallCount', 0);
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
              serviceFunction +
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
              serviceFunction +
                ': database manager operation and remote service call must be executed inside a transaction or service function must be annotated with @NoTransaction if no transaction is needed'
            );
          } else if (
            clsNamespace.get('remoteServiceCallCount') > 1 &&
            !serviceFunctionAnnotationContainer.isServiceFunctionNonDistributedTransactional(
              controller[serviceName].constructor,
              functionName
            )
          ) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              serviceFunction +
                ": multiple remote service calls cannot be executed because distributed transactions are not supported. To allow multiple remote service calls that don't require a transaction, annotate service function with @NoDistributedTransaction"
            );
          } else if (clsNamespace.get('dbManagerOperationAfterRemoteServiceCall')) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(
              serviceFunction +
                ': database manager operation(s) that can fail cannot be called after a remote service call that cannot be rolled back. Alternatively, service function must be annotated with @NoDistributedTransaction if no distributed transaction is needed'
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
          defaultServiceMetrics.incrementHttpClientErrorCounter(serviceFunction);
        }
        // noinspection ExceptionCaughtLocallyJS
        throw new HttpException(response, response.statusCode);
      }

      if (response !== undefined) {
        const serviceFunctionBaseReturnTypeName = getTypeInfoForTypeName(
          controller[`${serviceName}Types`].functionNameToReturnTypeNameMap[functionName]
        ).baseTypeName;

        const ServiceFunctionReturnType = controller[serviceName]['Types'][serviceFunctionBaseReturnTypeName];

        if (Array.isArray(response) && response.length > 0 && typeof response[0] === 'object') {
          await tryValidateResponse(response[0], ServiceFunctionReturnType);
        } else if (typeof response === 'object') {
          await tryValidateResponse(response, ServiceFunctionReturnType);
        }

        if (
          options?.httpMethod === 'GET' &&
          controller?.responseCacheConfigService.shouldCacheServiceFunctionCallResponse(
            serviceFunction,
            serviceFunctionArgument
          )
        ) {
          const redis = new Redis(controller?.responseCacheConfigService.getRedisUrl());
          response = JSON.stringify(response);
          const key = getNamespacedServiceName() + ':' + serviceFunction;

          try {
            await redis.hset(key, JSON.stringify(serviceFunctionArgument), response);
            log(Severity.DEBUG, 'Stored service function call response to Redis cache', '', {
              redisUrl: controller?.responseCacheConfigService.getRedisUrl(),
              key
            });
            defaultServiceMetrics.incrementServiceFunctionCallCachedResponsesCounterByOne(serviceName);
            if (await redis.exists(key)) {
              ttl = await redis.ttl(key);
            } else {
              await redis.expire(
                key,
                controller?.responseCacheConfigService.getCachingDurationInSecs(serviceFunction)
              );
              ttl = controller?.responseCacheConfigService.getCachingDurationInSecs(serviceFunction);
            }
          } catch (error) {
            log(Severity.ERROR, 'Failed to access Redis cache', error.message, {
              redisUrl: controller?.responseCacheConfigService.getRedisUrl()
            });
          }
        }
      }
    }

    const serviceFunctionProcessingTimeInMillis = Date.now() - serviceFunctionCallStartTimeInMillis;
    defaultServiceMetrics.incrementServiceFunctionProcessingTimeInSecsBucketCounterByOne(
      serviceFunction,
      serviceFunctionProcessingTimeInMillis / 1000
    );

    if (ttl) {
      if (typeof resp.header === 'function') {
        resp?.header('Cache-Control', 'max-age=' + ttl);
      } else if (typeof resp.set === 'function') {
        resp?.set('Cache-Control', 'max-age=' + ttl);
      }
    }

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
        controller[serviceName] instanceof UsersBaseService ? functionName : serviceFunction,
        storedError ? 'failure' : 'success',
        storedError?.getStatus(),
        storedError?.getResponse().errorMessage,
        controller[serviceName] instanceof UsersBaseService ? serviceFunctionArgument : { _id: response._id }
      );
      await (controller?.auditLoggingService as AuditLoggingService).log(auditLogEntry);
    }
  }
}
