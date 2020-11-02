import { HttpException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { createNamespace } from 'cls-hooked';
import _ from 'lodash';
import authorize from '../authorization/authorize';
import BaseService from '../service/BaseService';
import tryVerifyCaptchaToken from '../captcha/tryVerifyCaptchaToken';
import getPropertyBaseTypeName from '../utils/type/getPropertyBaseTypeName';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import UsersBaseService from '../users/UsersBaseService';
import { ServiceMetadata } from '../metadata/ServiceMetadata';
import tryValidateObject from '../validation/tryValidateObject';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import tryValidateResponse from '../validation/tryValidateResponse';
import isErrorResponse from '../errors/isErrorResponse';
import getReturnValueBaseType from '../utils/type/getReturnValueBaseType';

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
  authHeader: string,
  options?: ExecuteServiceFunctionOptions
): Promise<void | object> {
  const [serviceName, functionName] = serviceFunction.split('.');

  if (options?.httpMethod === 'GET') {
    if (!options?.allowedServiceFunctionsRegExpForHttpGetMethod) {
      throw new Error('allowedServiceFunctionsRegExpForHttpGetMethod must be specified in GET endpoint');
    }
    if (
      !serviceFunction.match(options?.allowedServiceFunctionsRegExpForHttpGetMethod) ||
      options?.deniedServiceFunctionsForForHttpGetMethod?.includes(serviceFunction)
    ) {
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode(
          'Service function cannot be called with HTTP GET. Use HTTP POST instead',
          400
        )
      );
    }

    // noinspection AssignmentToFunctionParameterJS
    serviceFunctionArgument = decodeURIComponent(serviceFunctionArgument);
    // noinspection AssignmentToFunctionParameterJS
    try {
      serviceFunctionArgument = JSON.parse(serviceFunctionArgument);
    } catch (error) {
      createErrorFromErrorMessageAndThrowError(
        createErrorMessageWithStatusCode(
          'Invalid or too long service function argument. Argument must be a URI encoded JSON object string',
          400
        )
      );
    }
  }

  if (serviceFunction === 'metadataService.getServicesMetadata') {
    if (!options || options.isMetadataServiceEnabled === undefined || options.isMetadataServiceEnabled) {
      return controller.servicesMetadata;
    }
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, 400)
    );
  } else if (serviceFunction === 'livenessCheckService.isAlive') {
    return;
  } else if (
    serviceFunction === 'readinessCheckService.isReady' &&
    (!controller[serviceName] || !controller[serviceName][functionName])
  ) {
    return;
  }

  if (!controller[serviceName]) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, 400)
    );
  }

  if (!controller[serviceName][functionName]) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(`Unknown function: ${serviceName}.${functionName}`, 400)
    );
  }

  if (typeof serviceFunctionArgument !== 'object' || Array.isArray(serviceFunctionArgument)) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(
        `Invalid service function argument. Argument must be a JSON object string`,
        400
      )
    );
  }
  const usersService = Object.values(controller).find((service) => service instanceof UsersBaseService);

  await authorize(
    controller[serviceName],
    functionName,
    serviceFunctionArgument,
    authHeader,
    controller['authorizationService'],
    usersService as UsersBaseService | undefined
  );

  if (serviceFunctionArgument?.captchaToken) {
    tryVerifyCaptchaToken(controller, serviceFunctionArgument.captchaToken);
  }

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

            const baseTypeName = getPropertyBaseTypeName(
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

          const baseTypeName = getPropertyBaseTypeName(
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
        createErrorMessageWithStatusCode('Missing service function argument', 400)
      );
    }

    await tryValidateObject(instantiatedServiceFunctionArgument);
  }

  const dbManager = (controller[serviceName] as BaseService).getDbManager();
  let response;

  if (dbManager) {
    const clsNamespace = createNamespace('dbManager');
    dbManager.setClsNamespaceName('dbManager');
    response = await clsNamespace.runAndReturn(async () => {
      // TODO: surround db operations with try catch and throw proper 500 error
      await dbManager.reserveDbConnectionFromPool();
      const response = await controller[serviceName][functionName](instantiatedServiceFunctionArgument);
      dbManager.releaseDbConnectionBackToPool();
      return response;
    });
  } else {
    response = await controller[serviceName][functionName](instantiatedServiceFunctionArgument);
  }

  if (response && isErrorResponse(response)) {
    throw new HttpException(response, response.statusCode);
  }

  if (response !== undefined) {
    const serviceFunctionBaseReturnTypeName = getReturnValueBaseType(
      controller[`${serviceName}Types`].functionNameToReturnTypeNameMap[functionName]
    );

    const ServiceFunctionReturnType = controller[serviceName]['Types'][serviceFunctionBaseReturnTypeName];

    if (Array.isArray(response) && response.length > 0 && typeof response[0] === 'object') {
      await tryValidateResponse(response[0], ServiceFunctionReturnType);
    } else if (typeof response === 'object') {
      await tryValidateResponse(response, ServiceFunctionReturnType);
    }
  }

  return response;
}
