import { plainToClass } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';
import { HttpException, HttpStatus } from '@nestjs/common';
import throwHttpException from './throwHttpException';

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

export default async function executeServiceCall(
  controller: any,
  serviceCall: string,
  serviceCallArgument: object
): Promise<void | object> {
  if (serviceCall === 'metadata') {
    return controller.servicesMetadata;
  }

  const [serviceName, functionName] = serviceCall.split('.');
  if (!controller[serviceName]) {
    throwHttpException({
      statusCode: HttpStatus.BAD_REQUEST,
      errorMessage: `Unknown service: ${serviceName}`
    });
  }

  if(!controller[serviceName][functionName]) {
    throwHttpException({
      statusCode: HttpStatus.BAD_REQUEST,
      errorMessage: `Unknown function: ${serviceName}.${functionName}`
    });
  }

  const paramObjectTypeName = controller[`${serviceName}Types`].functionNameToParamTypeNameMap[functionName];

  let validatableParamObject: any;
  if (paramObjectTypeName) {
    validatableParamObject = plainToClass(
      controller[serviceName]['Types'][paramObjectTypeName],
      serviceCallArgument
    );

    try {
      await validateOrReject(validatableParamObject as object, {
        whitelist: true,
        forbidNonWhitelisted: true
      });
    } catch (validationErrors) {
      const errorMessage = getValidationErrors(validationErrors);
      throwHttpException({ statusCode: HttpStatus.BAD_REQUEST, errorMessage });
    }
  }

  const response = await controller[serviceName][functionName](validatableParamObject);

  if (response && response.statusCode && response.errorMessage) {
    throw new HttpException(response, response.statusCode);
  }

  if (
    validatableParamObject &&
    validatableParamObject.pageSize &&
    Array.isArray(response) &&
    response.length > validatableParamObject.pageSize
  ) {
    return response.slice(0, validatableParamObject.pageSize);
  }

  return response;
}
