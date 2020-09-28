import { plainToClass } from 'class-transformer';
import _ from 'lodash';
import { validateOrReject, ValidationError } from 'class-validator';
import { HttpException, HttpStatus } from '@nestjs/common';
import throwHttpException from './throwHttpException';
import BaseService from './BaseService';
import { createNamespace } from 'cls-hooked';
import { ServiceMetadata } from './generateServicesMetadata';
import getPropertyBaseTypeName from './getPropertyBaseTypeName';
import verifyCaptchaToken from './captcha/verifyCaptchaToken';
import authorize from './authorization/authorize';

function getValidationErrors(validationErrors: ValidationError[]): string {
  return validationErrors
    .map((validationError: ValidationError) => {
      if (validationError.constraints) {
        return Object.values(validationError.constraints)
          .map((constraint) => constraint)
          .join(', ');
      } else {
        return validationError.property + ': ' + getValidationErrors(validationError.children);
      }
    })
    .join(', ');
}

export default async function executeServiceFunction(
  controller: any,
  serviceFunction: string,
  serviceFunctionArgument: any,
  authHeader: string
): Promise<void | object> {
  const [serviceName, functionName] = serviceFunction.split('.');

  if (serviceFunction === 'metadataService.getServicesMetadata') {
    return controller.servicesMetadata;
  } else if (serviceFunction === 'livenessCheckService.isAlive') {
    return;
  } else if (
    serviceFunction === 'readinessCheckService.isReady' &&
    (!controller[serviceName] || !controller[serviceName][functionName])
  ) {
    return;
  }

  if (!controller[serviceName]) {
    throwHttpException({
      statusCode: HttpStatus.BAD_REQUEST,
      errorMessage: `Unknown service: ${serviceName}`
    });
  }

  if (!controller[serviceName][functionName]) {
    throwHttpException({
      statusCode: HttpStatus.BAD_REQUEST,
      errorMessage: `Unknown function: ${serviceName}.${functionName}`
    });
  }

  if (serviceFunctionArgument?.captchaToken) {
    verifyCaptchaToken(controller, serviceFunctionArgument.captchaToken);
  }

  await authorize(
    controller[serviceName].constructor,
    functionName,
    authHeader,
    controller['authorizationService']
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
      throwHttpException({
        statusCode: HttpStatus.BAD_REQUEST,
        errorMessage: `Missing service function argument`
      });
    }

    try {
      await validateOrReject(instantiatedServiceFunctionArgument as object, {
        whitelist: true,
        forbidNonWhitelisted: true
      });
    } catch (validationErrors) {
      const errorMessage = getValidationErrors(validationErrors);
      throwHttpException({ statusCode: HttpStatus.BAD_REQUEST, errorMessage });
    }
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

  if (
    instantiatedServiceFunctionArgument &&
    instantiatedServiceFunctionArgument.pageSize &&
    Array.isArray(response) &&
    response.length > instantiatedServiceFunctionArgument.pageSize
  ) {
    return response.slice(0, instantiatedServiceFunctionArgument.pageSize);
  }

  return response;
}
