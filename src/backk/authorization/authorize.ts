import throwHttpException from '../throwHttpException';
import { HttpStatus } from '@nestjs/common';
import serviceAnnotationContainer from '../annotations/service/serviceAnnotationContainer';
import AuthorizationService from './AuthorizationService';
import serviceFunctionAnnotationContainer from '../annotations/service/function/serviceFunctionAnnotationContainer';
import BaseService from '../BaseService';

export default function authorize(
  service: BaseService,
  functionName: string,
  serviceFunctionArgument: any,
  authHeader: string | undefined,
  authorizationService: any
): Promise<void> {
  const ServiceClass = service.constructor;

  if (!authorizationService || !(authorizationService instanceof AuthorizationService)) {
    throw new Error('Authorization service missing');
  }

  if (authHeader === undefined) {
    if (
      serviceAnnotationContainer.isServiceAllowedForInternalUse(ServiceClass) ||
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForInternalUse(ServiceClass, functionName)
    ) {
      return Promise.resolve(undefined);
    }
  } else {
    if (
      serviceAnnotationContainer.isServiceAllowedForEveryUser(ServiceClass) ||
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForEveryUser(ServiceClass, functionName)
    ) {
      return Promise.resolve(undefined);
    }

    let allowedRoles: string[] = [];
    allowedRoles = allowedRoles.concat(serviceAnnotationContainer.getAllowedUserRoles(ServiceClass));
    allowedRoles = allowedRoles.concat(
      serviceFunctionAnnotationContainer.getAllowedUserRoles(ServiceClass, functionName)
    );

    if (authorizationService.hasUserRoleIn(allowedRoles, authHeader)) {
      return Promise.resolve(undefined);
    }

    if (
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForSelf(ServiceClass, functionName) &&
      serviceFunctionArgument
    ) {
      const userName = serviceFunctionArgument.userName;
      const userId =
        serviceFunctionArgument.userId ||
        (service.isUsersService() ? serviceFunctionArgument._id : undefined);
      const userIdTypeInServiceFunctionArgument = userId ? 'userId' : 'userName';
      const userIdInServiceFunctionArgument = userId ?? userName;

      if (
        authorizationService.areSameIdentities(
          userIdTypeInServiceFunctionArgument,
          userIdInServiceFunctionArgument,
          authHeader
        )
      )
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
