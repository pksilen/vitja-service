import throwHttpException from '../throwHttpException';
import { HttpStatus } from '@nestjs/common';
import serviceAnnotationContainer from '../annotations/service/serviceAnnotationContainer';
import AuthorizationService from './AuthorizationService';
import serviceFunctionAnnotationContainer from '../annotations/service/function/serviceFunctionAnnotationContainer';

export default function authorize(
  serviceClass: Function,
  functionName: string,
  authHeader: string | undefined,
  authorizationService: any
): Promise<void> {
  if (!authorizationService || !(authorizationService instanceof AuthorizationService)) {
    throw new Error('Authorization service missing');
  }

  if (authHeader === undefined) {
    if (
      serviceAnnotationContainer.isServiceAllowedForInternalUse(serviceClass) ||
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForInternalUse(serviceClass, functionName)
    ) {
      return Promise.resolve(undefined);
    }
  } else {
    if (
      serviceAnnotationContainer.isServiceAllowedForEveryUser(serviceClass) ||
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForEveryUser(serviceClass, functionName)
    ) {
      return Promise.resolve(undefined);
    }

    let allowedRoles: string[] = [];
    allowedRoles = allowedRoles.concat(serviceAnnotationContainer.getAllowedUserRoles(serviceClass));
    allowedRoles = allowedRoles.concat(
      serviceFunctionAnnotationContainer.getAllowedUserRoles(serviceClass, functionName)
    );

    if (authorizationService.hasUserRoleIn(allowedRoles, authHeader)) {
      return Promise.resolve(undefined);
    }
  }

  throwHttpException({
    statusCode: HttpStatus.FORBIDDEN,
    errorMessage: 'Attempted service function call not authorized'
  });

  // Unreachable code
  return Promise.resolve(undefined);
}
