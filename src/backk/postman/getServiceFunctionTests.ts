import getSetCollectionVariableStatements from './getSetCollectionVariablesStatements';
import getServiceFunctionReturnValueTests from './getServiceFunctionReturnValueTests';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import { FunctionMetadata } from '../metadata/types/FunctionMetadata';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';

export default function getServiceFunctionTests(
  serviceTypes: { [key: string]: Function },
  serviceMetadata: ServiceMetadata,
  functionMetadata: FunctionMetadata,
  isUpdate: boolean,
  expectedResponseStatusCode = 200,
  expectedResponseFieldPathNameToFieldValueMapInTests: {[key: string]: any } | undefined = undefined,
  sampleArg: object | undefined = undefined
): object | undefined {
  const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
  const serviceEntityName = serviceBaseName;
  const { baseTypeName, isArrayType } = getTypeInfoForTypeName(functionMetadata.returnValueType);

  const checkResponseCode = `pm.test("Status code is ${expectedResponseStatusCode}", function () {
  pm.response.to.have.status(${expectedResponseStatusCode});
});`;

  if (
    functionMetadata.functionName.startsWith('create') ||
    functionMetadata.functionName.startsWith('add') ||
    functionMetadata.functionName.startsWith('insert')
  ) {
    return {
      id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
      listen: 'test',
      script: {
        id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
        exec: [
          checkResponseCode,
          'const response = pm.response.json()',
          ...getSetCollectionVariableStatements(
            serviceEntityName,
            baseTypeName,
            serviceMetadata,
            serviceTypes,
            isArrayType ? '[0].' : '.'
          ),
          ...getServiceFunctionReturnValueTests(
            serviceTypes,
            baseTypeName,
            serviceMetadata,
            isArrayType ? '[0].' : '.',
            true,
            isUpdate,
            sampleArg,
            expectedResponseFieldPathNameToFieldValueMapInTests
          ).slice(1)
        ]
      }
    };
  }

  const serviceFunctionReturnValueTests = baseTypeName === 'null' ? [] : getServiceFunctionReturnValueTests(
    serviceTypes,
    baseTypeName,
    serviceMetadata,
    isArrayType ? '[0].' : '.',
    true,
    isUpdate,
    sampleArg,
    expectedResponseFieldPathNameToFieldValueMapInTests
  );

  return {
    id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
    listen: 'test',
    script: {
      id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
      exec:
        baseTypeName === 'null' || expectedResponseStatusCode !== 200
          ? [checkResponseCode]
          : [checkResponseCode, ...serviceFunctionReturnValueTests]
    }
  };
}
