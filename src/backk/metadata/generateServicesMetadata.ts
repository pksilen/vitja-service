import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import serviceAnnotationContainer from '../decorators/service/serviceAnnotationContainer';
import BaseService from '../service/BaseService';
import _Id from '../types/id/_Id';
import IdsAndDefaultPostQueryOperationsArg from '../types/postqueryoperations/args/IdsAndDefaultPostQueryOperationsArg';
import SortBy from '../types/postqueryoperations/SortBy';
import IdAndUserId from '../types/id/IdAndUserId';
import Id from '../types/id/Id';
import { ServiceMetadata } from './ServiceMetadata';
import getTypeMetadata from './getTypeMetadata';
import { FunctionMetadata } from './FunctionMetadata';
import getValidationMetadata from './getValidationMetadata';
import getTypeDocumentation from './getTypeDocumentation';
import DefaultPostQueryOperationsArg from '../types/postqueryoperations/args/DefaultPostQueryOperationsArg';
import DefaultPostQueryOperations from '../types/postqueryoperations/DefaultPostQueryOperations';

export default function generateServicesMetadata<T>(controller: T, isFirstRound = true): ServiceMetadata[] {
  return Object.entries(controller)
    .filter(([, service]: [string, any]) => service instanceof BaseService)
    .map(([serviceName, service]: [string, any]) => {
      const ServiceClass = service.constructor;
      const functionNames = Object.keys(
        (controller as any)[`${serviceName}Types`].functionNameToReturnTypeNameMap
      );

      const typesMetadata = Object.entries((controller as any)[serviceName].Types ?? {}).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const typeObject = getTypeMetadata(typeClass, true, isFirstRound);
          return { ...accumulatedTypes, [typeName]: typeObject };
        },
        {}
      );

      const functions: FunctionMetadata[] = functionNames
        .filter(
          (functionName) =>
            !serviceFunctionAnnotationContainer.isServiceFunctionPrivate(
              (controller as any)[serviceName].constructor,
              functionName
            )
        )
        .map((functionName: string) => {
          if (
            !serviceAnnotationContainer.isServiceAllowedForInternalUse(ServiceClass) &&
            !serviceAnnotationContainer.isServiceAllowedForEveryUser(ServiceClass) &&
            serviceAnnotationContainer.getAllowedUserRoles(ServiceClass).length === 0 &&
            !serviceFunctionAnnotationContainer.isServiceFunctionAllowedForSelf(ServiceClass, functionName) &&
            !serviceFunctionAnnotationContainer.isServiceFunctionAllowedForInternalUse(
              ServiceClass,
              functionName
            ) &&
            !serviceFunctionAnnotationContainer.isServiceFunctionAllowedForEveryUser(
              ServiceClass,
              functionName
            ) &&
            serviceFunctionAnnotationContainer.getAllowedUserRoles(ServiceClass, functionName).length === 0 &&
            !serviceFunctionAnnotationContainer.isServiceFunctionPrivate(ServiceClass, functionName) &&
            !serviceFunctionAnnotationContainer.isServiceFunctionAllowedForTests(ServiceClass, functionName)
          ) {
            throw new Error(serviceName + '.' + functionName + ': is missing authorization annotation');
          }

          const paramTypeName = (controller as any)[`${serviceName}Types`].functionNameToParamTypeNameMap[
            functionName
          ];

          if (
            !isFirstRound &&
            functionName.startsWith('create') &&
            paramTypeName &&
            !(typesMetadata as any)[paramTypeName].captchaToken &&
            !serviceFunctionAnnotationContainer.hasNoCaptchaAnnotationForServiceFunction(
              service.constructor,
              functionName
            )
          ) {
            throw new Error(
              serviceName +
                '.' +
                functionName +
                ': argument type must implement Captcha or service function must be annotated with NoCaptcha annotation'
            );
          }

          const returnValueTypeName: string = (controller as any)[`${serviceName}Types`]
            .functionNameToReturnTypeNameMap[functionName];

          if (paramTypeName !== undefined && !(controller as any)[serviceName].Types[paramTypeName]) {
            if (paramTypeName === '_Id') {
              (controller as any)[serviceName].Types[paramTypeName] = _Id;
            } else if (paramTypeName === 'Id') {
              (controller as any)[serviceName].Types[paramTypeName] = Id;
            } else if (paramTypeName === 'IdsAndDefaultPostQueryOperationsArg') {
              (controller as any)[serviceName].Types[paramTypeName] = IdsAndDefaultPostQueryOperationsArg;
            } else if (paramTypeName === 'IdAndUserId') {
              (controller as any)[serviceName].Types[paramTypeName] = IdAndUserId;
            } else {
              throw new Error('Type: ' + paramTypeName + ' is not found in ' + serviceName + '.Types');
            }
          }

          if (paramTypeName !== undefined) {
            let proto = Object.getPrototypeOf(
              new ((controller as any)[serviceName].Types[paramTypeName] as new () => any)()
            );
            while (proto !== Object.prototype) {
              if (!(controller as any)[serviceName].Types[proto.constructor.name]) {
                if (proto.constructor.name === 'DefaultPostQueryOperationsArg') {
                  (controller as any)[serviceName].Types[
                    'DefaultPostQueryOperations'
                  ] = DefaultPostQueryOperations;
                  (controller as any)[serviceName].Types['SortBy'] = SortBy;
                }
                (controller as any)[serviceName].Types[proto.constructor.name] = proto.constructor;
              }
              proto = Object.getPrototypeOf(proto);
            }
          }

          const returnValueParts = returnValueTypeName.split('|');
          if (returnValueParts.length > 1) {
            const errorResponseType = returnValueParts[1].trim();
            if (errorResponseType !== 'ErrorResponse') {
              throw new Error(
                serviceName +
                  '.' +
                  functionName +
                  ": return type's right hand side type must be ErrorResponse"
              );
            }
          }
          let finalReturnValueTypeName = returnValueParts[0].trim();
          if (finalReturnValueTypeName.endsWith('[]')) {
            finalReturnValueTypeName = finalReturnValueTypeName.slice(0, -2);
          }
          if (finalReturnValueTypeName.startsWith('Array<')) {
            finalReturnValueTypeName = finalReturnValueTypeName.slice(6, -1);
          }

          if (finalReturnValueTypeName.startsWith('Partial<')) {
            finalReturnValueTypeName = finalReturnValueTypeName.slice(8, -1);
          }

          if (
            finalReturnValueTypeName !== 'void' &&
            !(controller as any)[serviceName].Types[finalReturnValueTypeName]
          ) {
            if (finalReturnValueTypeName === '_Id') {
              (controller as any)[serviceName].Types[finalReturnValueTypeName] = _Id;
            } else if (finalReturnValueTypeName === 'Id') {
              (controller as any)[serviceName].Types[finalReturnValueTypeName] = Id;
            } else {
              throw new Error(
                'Type: ' + finalReturnValueTypeName + ' is not found in ' + serviceName + '.Types'
              );
            }
          }

          if (finalReturnValueTypeName !== 'void') {
            let proto = Object.getPrototypeOf(
              new ((controller as any)[serviceName].Types[finalReturnValueTypeName] as new () => any)()
            );
            while (proto !== Object.prototype) {
              if (!(controller as any)[serviceName].Types[proto.constructor.name]) {
                (controller as any)[serviceName].Types[proto.constructor.name] = proto.constructor;
              }
              proto = Object.getPrototypeOf(proto);
            }
          }

          return {
            functionName,
            functionDocumentation: serviceFunctionAnnotationContainer.getDocumentationForServiceFunction(
              service.constructor,
              functionName
            ),
            argType: paramTypeName,
            returnValueType: returnValueTypeName,
            errors: serviceFunctionAnnotationContainer.getErrorsForServiceFunction(
              service.constructor,
              functionName
            ) ?? []
          };
        });

      const validationMetadatas = Object.entries((controller as any)[serviceName].Types ?? {}).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const validationMetadata = getValidationMetadata(typeClass);
          if (Object.keys(validationMetadata).length > 0) {
            return { ...accumulatedTypes, [typeName]: validationMetadata };
          }
          return accumulatedTypes;
        },
        {}
      );

      const typesDocumentation = Object.entries((controller as any)[serviceName].Types ?? {}).reduce(
        (accumulatedTypesDocumentation, [typeName, typeClass]: [string, any]) => {
          const typeDocumentation = getTypeDocumentation((typesMetadata as any)[typeName], typeClass);
          return Object.keys(typeDocumentation).length > 0
            ? { ...accumulatedTypesDocumentation, [typeName]: typeDocumentation }
            : accumulatedTypesDocumentation;
        },
        {}
      );

      return {
        serviceName,
        serviceDocumentation: serviceAnnotationContainer.getDocumentationForService(service.constructor),
        functions,
        types: {
          ...typesMetadata,
          ErrorResponse: {
            statusCode: 'integer',
            errorMessage: 'string'
          }
        },
        typesDocumentation,
        validations: validationMetadatas
      };
    });
}
