import serviceFunctionAnnotationContainer
  from "../decorators/service/function/serviceFunctionAnnotationContainer";
import serviceAnnotationContainer from "../decorators/service/serviceAnnotationContainer";
import BaseService from "../service/BaseService";
import { ServiceMetadata } from "./ServiceMetadata";
import getClassPropertyNameToPropertyTypeNameMap from "./getClassPropertyNameToPropertyTypeNameMap";
import { FunctionMetadata } from "./FunctionMetadata";
import getValidationMetadata from "./getValidationMetadata";
import getTypeDocumentation from "./getTypeDocumentation";

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
          const typeObject = getClassPropertyNameToPropertyTypeNameMap(typeClass, true, isFirstRound);
          return { ...accumulatedTypes, [typeName]: typeObject };
        },
        {}
      );

      const publicTypesMetadata = Object.entries((controller as any)[serviceName].PublicTypes ?? {}).reduce(
        (accumulatedTypes, [typeName, typeClass]: [string, any]) => {
          const typeObject = getClassPropertyNameToPropertyTypeNameMap(typeClass, true, isFirstRound);
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
            !serviceFunctionAnnotationContainer.isServiceFunctionAllowedForSelf(ServiceClass, functionName) &&
            !serviceFunctionAnnotationContainer.isServiceFunctionAllowedForClusterInternalUse(
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


          const returnValueTypeName: string = (controller as any)[`${serviceName}Types`]
            .functionNameToReturnTypeNameMap[functionName];

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
        publicTypes: {
          ...publicTypesMetadata,
          ErrorResponse: {
            statusCode: 'integer',
            errorCode: '?string',
            errorMessage: 'string',
            stackTrace: '?string'
          }},
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
