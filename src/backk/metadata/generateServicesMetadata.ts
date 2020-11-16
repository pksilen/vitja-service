import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import serviceAnnotationContainer from '../decorators/service/serviceAnnotationContainer';
import BaseService from '../service/BaseService';
import _Id from '../types/id/_Id';
import IdsAndDefaultPostQueryOperationsArg from '../types/postqueryoperations/args/IdsAndDefaultPostQueryOperationsArg';
import SortBy from '../types/postqueryoperations/SortBy';
import IdAndUserId from '../types/id/IdAndUserId';
import Id from '../types/id/Id';
import { ServiceMetadata } from './ServiceMetadata';
import getPropertyNameToPropertyTypeNameMap from './getPropertyNameToPropertyTypeNameMap';
import { FunctionMetadata } from './FunctionMetadata';
import getValidationMetadata from './getValidationMetadata';
import getTypeDocumentation from './getTypeDocumentation';
import DefaultPostQueryOperations from '../types/postqueryoperations/DefaultPostQueryOperations';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';

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
          const typeObject = getPropertyNameToPropertyTypeNameMap(typeClass, true, isFirstRound);
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

          const functionArgumentTypeName = (controller as any)[`${serviceName}Types`]
            .functionNameToParamTypeNameMap[functionName];

          if (
            !isFirstRound &&
            (functionName.startsWith('create') || functionName.startsWith('insert')) &&
            functionArgumentTypeName &&
            !(typesMetadata as any)[functionArgumentTypeName].captchaToken &&
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

          if (
            functionArgumentTypeName !== undefined &&
            !(controller as any)[serviceName].Types[functionArgumentTypeName]
          ) {
            if (functionArgumentTypeName === '_Id') {
              (controller as any)[serviceName].Types[functionArgumentTypeName] = _Id;
            } else if (functionArgumentTypeName === 'Id') {
              (controller as any)[serviceName].Types[functionArgumentTypeName] = Id;
            } else if (functionArgumentTypeName === 'IdsAndDefaultPostQueryOperationsArg') {
              (controller as any)[serviceName].Types[
                functionArgumentTypeName
              ] = IdsAndDefaultPostQueryOperationsArg;
            } else if (functionArgumentTypeName === 'IdAndUserId') {
              (controller as any)[serviceName].Types[functionArgumentTypeName] = IdAndUserId;
            } else {
              throw new Error(
                'Type: ' + functionArgumentTypeName + ' is not found in ' + serviceName + '.Types'
              );
            }
          }

          if (functionArgumentTypeName !== undefined) {
            let proto = Object.getPrototypeOf(
              new ((controller as any)[serviceName].Types[functionArgumentTypeName] as new () => any)()
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

          const returnValueTypeName: string = (controller as any)[`${serviceName}Types`]
            .functionNameToReturnTypeNameMap[functionName];

          const { baseTypeName, canBeErrorResponse } = getTypeInfoForTypeName(returnValueTypeName);

          if (!canBeErrorResponse) {
            throw new Error(
              serviceName + '.' + functionName + ": return type's right hand side type must be ErrorResponse"
            );
          }

          if (baseTypeName !== 'void' && !(controller as any)[serviceName].Types[baseTypeName]) {
            if (baseTypeName === '_Id') {
              (controller as any)[serviceName].Types[baseTypeName] = _Id;
            } else if (baseTypeName === 'Id') {
              (controller as any)[serviceName].Types[baseTypeName] = Id;
            } else {
              throw new Error('Type: ' + baseTypeName + ' is not found in ' + serviceName + '.Types');
            }
          }

          if (baseTypeName !== 'void') {
            let proto = Object.getPrototypeOf(
              new ((controller as any)[serviceName].Types[baseTypeName] as new () => any)()
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
            argType: functionArgumentTypeName,
            returnValueType: returnValueTypeName,
            errors:
              serviceFunctionAnnotationContainer.getErrorsForServiceFunction(
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
            errorCode: '?string',
            errorMessage: 'string',
            stackTrace: '?string'
          }
        },
        typesDocumentation,
        validations: validationMetadatas
      };
    });
}
