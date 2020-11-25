import BaseService from '../service/BaseService';
import generateClassFromSrcFile from '../typescript-parser/generateClassFromSrcFile';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';

export default function generateTypesForServices<T>(controller: T) {
  return Object.entries(controller)
    .filter(([, service]: [string, any]) => service instanceof BaseService)
    .map(([serviceName]: [string, any]) => {
      const functionNames = Object.keys(
        (controller as any)[`${serviceName}Types`].functionNameToReturnTypeNameMap
      );

      functionNames.forEach((functionName) => {
        const functionArgumentTypeName = (controller as any)[`${serviceName}Types`]
          .functionNameToParamTypeNameMap[functionName];

        if (
          functionArgumentTypeName !== undefined &&
          !(controller as any)[serviceName].Types[functionArgumentTypeName]
        ) {
          const FunctionArgumentClass = generateClassFromSrcFile(functionArgumentTypeName);
          (controller as any)[serviceName].Types[functionArgumentTypeName] = FunctionArgumentClass;
          (controller as any)[serviceName].PublicTypes[functionArgumentTypeName] = FunctionArgumentClass;
        }

        if (functionArgumentTypeName !== undefined) {
          let proto = Object.getPrototypeOf(
            new ((controller as any)[serviceName].Types[functionArgumentTypeName] as new () => any)()
          );
          while (proto !== Object.prototype) {
            if (!(controller as any)[serviceName].Types[proto.constructor.name]) {
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
          const FunctionReturnValueClass = generateClassFromSrcFile(baseTypeName);
          (controller as any)[serviceName].Types[baseTypeName] = FunctionReturnValueClass;
          (controller as any)[serviceName].PublicTypes[baseTypeName] = FunctionReturnValueClass;
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
      });
    });
}
