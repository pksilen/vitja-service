import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { sign } from 'jsonwebtoken';
import { Base64 } from 'js-base64';
import getServiceFunctionTestArgument from './getServiceFunctionTestArgument';
import createPostmanCollectionItem from './createPostmanCollectionItem';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import { FunctionMetadata } from '../metadata/types/FunctionMetadata';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';

export default function writeApiPostmanCollectionExportFile<T>(
  controller: T,
  servicesMetadata: ServiceMetadata[]
) {
  const items: any[] = [];

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) => {
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata) => {
      if (
        serviceFunctionAnnotationContainer.hasOnStartUp(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        return;
      }

      const sampleArg = getServiceFunctionTestArgument(
        (controller as any)[serviceMetadata.serviceName].Types,
        functionMetadata.functionName,
        functionMetadata.argType,
        serviceMetadata,
        false
      );

      const { baseTypeName, isArrayType } = getTypeInfoForTypeName(functionMetadata.returnValueType);

      const sampleResponse = getServiceFunctionTestArgument(
        (controller as any)[serviceMetadata.serviceName].Types,
        functionMetadata.functionName,
        baseTypeName,
        serviceMetadata,
        false
      );

      items.push(
        createPostmanCollectionItem(
          (controller as any)[serviceMetadata.serviceName].constructor,
          serviceMetadata,
          functionMetadata,
          sampleArg,
          undefined,
          sampleResponse,
          isArrayType
        )
      );
    });
  });

  const cwd = process.cwd();
  const appName = cwd.split('/').reverse()[0];

  const jwt = sign(
    { userName: 'abc', roles: [process.env.TEST_USER_ROLE] },
    process.env.JWT_SIGN_SECRET || 'abcdef'
  );

  const postmanMetadata = {
    info: {
      name: appName + ' API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: Base64.encode(jwt),
          type: 'string'
        }
      ]
    },
    item: [
      {
        name: 'metadataService.getServicesMetadata',
        request: {
          method: 'POST',
          url: {
            raw: 'http://localhost:3000/metadataService.getServicesMetadata',
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['metadataService.getServicesMetadata']
          }
        }
      },
      ...items
    ]
  };

  if (!existsSync(cwd + '/postman')) {
    mkdirSync(cwd + '/postman');
  }

  writeFileSync(
    process.cwd() + '/postman/' + appName.replace(/-/g, '_') + '_api_postman_collection.json',
    JSON.stringify(postmanMetadata, null, 4)
  );
}
