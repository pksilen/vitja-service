import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import serviceAnnotationContainer from '../decorators/service/serviceAnnotationContainer';
import AuthorizationService from './AuthorizationService';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import BaseService from '../service/BaseService';
import UsersBaseService from '../users/UsersBaseService';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import defaultServiceMetrics from '../observability/metrics/defaultServiceMetrics';

export default async function tryAuthorize(
  service: BaseService,
  functionName: string,
  serviceFunctionArgument: any,
  authHeader: string | undefined,
  authorizationService: any,
  usersService: UsersBaseService | undefined
): Promise<void> {
  const ServiceClass = service.constructor;

  if (!authorizationService || !(authorizationService instanceof AuthorizationService)) {
    throw new Error('Authorization service missing');
  }

  if (authHeader === undefined) {
    if (
      serviceAnnotationContainer.isServiceAllowedForInternalUse(ServiceClass) ||
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForInternalUse(ServiceClass, functionName) ||
      serviceAnnotationContainer.isServiceAllowedForEveryUser(ServiceClass)
    ) {
      return;
    }
  } else {
    if (
      serviceAnnotationContainer.isServiceAllowedForEveryUser(ServiceClass) ||
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForEveryUser(ServiceClass, functionName)
    ) {
      return;
    }

    let allowedRoles: string[] = [];
    allowedRoles = allowedRoles.concat(serviceAnnotationContainer.getAllowedUserRoles(ServiceClass));
    allowedRoles = allowedRoles.concat(
      serviceFunctionAnnotationContainer.getAllowedUserRoles(ServiceClass, functionName)
    );

    if (await authorizationService.hasUserRoleIn(allowedRoles, authHeader)) {
      return;
    }

    if (
      serviceFunctionAnnotationContainer.isServiceFunctionAllowedForSelf(ServiceClass, functionName) &&
      serviceFunctionArgument
    ) {
      let userName = serviceFunctionArgument.userName;
      const userId =
        serviceFunctionArgument.userId ||
        (service.isUsersService() ? serviceFunctionArgument._id : undefined);

      if (!userId && !userName) {
        throw new Error(
          ServiceClass.name +
            '.' +
            functionName +
            ': must have userId or userName property present in function argument'
        );
      }

      if (!userName && userId && usersService) {
        const userOrErrorResponse = await usersService.getUserById(userId);
        if ('_id' in userOrErrorResponse) {
          userName = userOrErrorResponse.userName;
        }
      }

      if (await authorizationService.areSameIdentities(userName, authHeader)) {
        return;
      }
    }
  }

  if (
    process.env.NODE_ENV === 'development' &&
    serviceFunctionAnnotationContainer.isServiceFunctionAllowedForTests(ServiceClass, functionName)
  ) {
    return;
  }

  defaultServiceMetrics.incrementAuthorizationFailuresByOne();
  createErrorFromErrorMessageAndThrowError(
    createErrorMessageWithStatusCode('Attempted service function call not authorized', 403)
  );
}
