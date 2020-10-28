import { HttpException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { createNamespace } from 'cls-hooked';
import _ from 'lodash';
import authorize from '../authorization/authorize';
import BaseService from './basetypes/BaseService';
import verifyCaptchaToken from '../captcha/verifyCaptchaToken';
import getPropertyBaseTypeName from '../utils/type/getPropertyBaseTypeName';
import throwHttpException from '../errors/throwHttpException';
import UsersBaseService from '../users/UsersBaseService';
import getBadRequestErrorResponse from '../errors/getBadRequestErrorResponse';
import { ServiceMetadata } from '../metadata/ServiceMetadata';
import tryValidateObject from '../validation/tryValidateObject';
import getErrorResponse from '../errors/getErrorResponse';

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
    throwHttpException(getBadRequestErrorResponse(`Unknown service: ${serviceName}`));
  } else if (serviceFunction === 'livenessCheckService.isAlive') {
    return;
  } else if (
    serviceFunction === 'readinessCheckService.isReady' &&
    (!controller[serviceName] || !controller[serviceName][functionName])
  ) {
    return;
  }

  if (!controller[serviceName]) {
    throwHttpException(getBadRequestErrorResponse(`Unknown service: ${serviceName}`));
  }

  if (!controller[serviceName][functionName]) {
    throwHttpException(getBadRequestErrorResponse(`Unknown function: ${serviceName}.${functionName}`));
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
      throwHttpException(getBadRequestErrorResponse('Missing service function argument'));
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
    throw new HttpException(
      getErrorResponse(new Error(response.errorMessage)),
      response.statusCode
    );
  }

  return response;
}
