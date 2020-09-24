import { plainToClass } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { HttpException, HttpStatus } from '@nestjs/common';
import throwHttpException from './throwHttpException';
import BaseService from './BaseService';
import { createNamespace } from 'cls-hooked';

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
  serviceFunctionArgument: object
): Promise<void | object> {
  if (serviceFunction === 'metadataService.getServicesMetadata') {
    return controller.servicesMetadata;
  } else if (serviceFunction === 'livenessCheckService.isAlive') {
    return;
  }

  const [serviceName, functionName] = serviceFunction.split('.');

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

  const serviceFunctionArgumentTypeName =
    controller[`${serviceName}Types`].functionNameToParamTypeNameMap[functionName];

  let instantiatedServiceFunctionArgument: any;
  if (serviceFunctionArgumentTypeName) {
    instantiatedServiceFunctionArgument = plainToClass(
      controller[serviceName]['Types'][serviceFunctionArgumentTypeName],
      serviceFunctionArgument
    );

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
