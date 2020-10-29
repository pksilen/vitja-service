import { HttpException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { createNamespace } from 'cls-hooked';
import _ from 'lodash';
import authorize from '../authorization/authorize';
import BaseService from './basetypes/BaseService';
import verifyCaptchaToken from '../captcha/verifyCaptchaToken';
import getPropertyBaseTypeName from '../utils/type/getPropertyBaseTypeName';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import UsersBaseService from '../users/UsersBaseService';
import { ServiceMetadata } from '../metadata/ServiceMetadata';
import tryValidateObject from '../validation/tryValidateObject';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';

export interface Options {
  isMetadataServiceEnabled?: boolean;
}

export default async function tryExecuteServiceFunction(
  controller: any,
  serviceFunction: string,
  serviceFunctionArgument: any,
  authHeader: string,
  options?: Options
): Promise<void | object> {
  const [serviceName, functionName] = serviceFunction.split('.');

  if (serviceFunction === 'metadataService.getServicesMetadata') {
    if (!options || options.isMetadataServiceEnabled === undefined || options.isMetadataServiceEnabled) {
      return controller.servicesMetadata;
    }
    createErrorFromErrorMessageAndThrowError(createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, 400));
  } else if (serviceFunction === 'livenessCheckService.isAlive') {
    return;
  } else if (
    serviceFunction === 'readinessCheckService.isReady' &&
    (!controller[serviceName] || !controller[serviceName][functionName])
  ) {
    return;
  }

  if (!controller[serviceName]) {
    createErrorFromErrorMessageAndThrowError(createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, 400));
  }

  if (!controller[serviceName][functionName]) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(`Unknown function: ${serviceName}.${functionName}`, 400)
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
    verifyCaptchaToken(controller, serviceFunctionArgument.captchaToken);
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
      createErrorFromErrorMessageAndThrowError(createErrorMessageWithStatusCode('Missing service function argument', 400));
    }

    await tryValidateObject(instantiatedServiceFunctionArgument);
  }

  const dbManager = (controller[serviceName] as BaseService).getDbManager();
  let response;

  if (dbManager) {
    const clsNamespace = createNamespace('dbManager');
    dbManager.setClsNamespaceName('dbManager');
    response = await clsNamespace.runAndReturn(async () => {
      await dbManager.reserveDbConnectionFromPool();
      const response = await controller[serviceName][functionName](instantiatedServiceFunctionArgument);
      dbManager.releaseDbConnectionBackToPool();
      return response;
    });
  } else {
    response = await controller[serviceName][functionName](instantiatedServiceFunctionArgument);
  }

  if (response && response.statusCode && response.errorMessage) {
    throw new HttpException(response, response.statusCode);
  }

  return response;
}
