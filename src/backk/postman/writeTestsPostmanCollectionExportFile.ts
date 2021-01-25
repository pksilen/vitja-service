import { getFileNamesRecursively } from '../utils/file/getSrcFilePathNameForTypeName';
import _ from 'lodash';
import YAML from 'yaml';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import serviceAnnotationContainer from '../decorators/service/serviceAnnotationContainer';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { sign } from 'jsonwebtoken';
import { Base64 } from 'js-base64';
import getServiceFunctionTests from './getServiceFunctionTests';
import getServiceMethodTestArgument from './getServiceMethodTestArgument';
import createPostmanCollectionItem from './createPostmanCollectionItem';
import addCustomTest from './addCustomTest';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import { FunctionMetadata } from '../metadata/types/FunctionMetadata';
import isReadFunction from '../crudresource/utils/isReadFunction';
import isUpdateFunction from '../crudresource/utils/isUpdateFunction';
import isDeleteFunction from '../crudresource/utils/isDeleteFunction';

export default function writeTestsPostmanCollectionExportFile<T>(
  controller: T,
  servicesMetadata: ServiceMetadata[]
) {
  const items: any[] = [];
  const testFilePathNames = getFileNamesRecursively(process.cwd() + '/integrationtests');
  const writtenTests = _.flatten(
    testFilePathNames.map((testFilePathName) => {
      const testFileContents = readFileSync(testFilePathName, { encoding: 'UTF-8' });
      const fileType = testFilePathName.endsWith('json') ? 'json' : 'yaml';
      const result = fileType === 'json' ? JSON.parse(testFileContents) : YAML.parse(testFileContents);
      return result;
    })
  );

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) => {
    if (
      serviceAnnotationContainer.hasNoAutoTestsAnnotationForServiceClass(
        (controller as any)[serviceMetadata.serviceName].constructor
      )
    ) {
      return;
    }

    let previousFunctionType: string;
    let lastGetFunctionMetadata: FunctionMetadata;
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata, index: number) => {
      if (
        serviceFunctionAnnotationContainer.hasNoAutoTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        return;
      }

      if (
        isReadFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        lastGetFunctionMetadata = functionMetadata;
      }

      const expectedResponseStatusCodeInTests = serviceFunctionAnnotationContainer.getExpectedResponseStatusCodeInTestsForServiceFunction(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      const tests = getServiceFunctionTests(
        (controller as any)[serviceMetadata.serviceName].Types,
        serviceMetadata,
        functionMetadata,
        false,
        expectedResponseStatusCodeInTests
      );

      let isUpdate = false;
      if (
        isUpdateFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) ||
        (previousFunctionType === 'update' &&
          !isDeleteFunction(
            (controller as any)[serviceMetadata.serviceName].constructor,
            functionMetadata.functionName
          ))
      ) {
        isUpdate = true;
        previousFunctionType = 'update';
        if (lastGetFunctionMetadata === undefined) {
          throw new Error(
            'There must be a get function defined before update/modify/change function in: ' +
              serviceMetadata.serviceName
          );
        }
      }

      const sampleArg = getServiceMethodTestArgument(
        (controller as any)[serviceMetadata.serviceName].Types,
        functionMetadata.functionName,
        functionMetadata.argType,
        serviceMetadata,
        isUpdate
      );

      items.push(createPostmanCollectionItem(serviceMetadata, functionMetadata, sampleArg, tests));

      if (isUpdate) {
        const getFunctionTests = getServiceFunctionTests(
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          lastGetFunctionMetadata,
          true,
          200,
          sampleArg
        );

        const getFunctionSampleArg = getServiceMethodTestArgument(
          (controller as any)[serviceMetadata.serviceName].Types,
          lastGetFunctionMetadata.functionName,
          lastGetFunctionMetadata.argType,
          serviceMetadata,
          isUpdate,
          sampleArg
        );

        items.push(
          createPostmanCollectionItem(
            serviceMetadata,
            lastGetFunctionMetadata,
            getFunctionSampleArg,
            getFunctionTests
          )
        );
      }

      if (
        isDeleteFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) &&
        index === serviceMetadata.functions.length - 1 &&
        lastGetFunctionMetadata
      ) {
        const getFunctionTests = getServiceFunctionTests(
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          lastGetFunctionMetadata,
          false,
          404
        );

        const getFunctionSampleArg = getServiceMethodTestArgument(
          (controller as any)[serviceMetadata.serviceName].Types,
          lastGetFunctionMetadata.functionName,
          lastGetFunctionMetadata.argType,
          serviceMetadata,
          true
        );

        items.push(
          createPostmanCollectionItem(
            serviceMetadata,
            lastGetFunctionMetadata,
            getFunctionSampleArg,
            getFunctionTests
          )
        );
      }

      writtenTests
        .filter(
          ({ testTemplate: { executeAfter } }) =>
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((writtenTest) => {
          addCustomTest(writtenTest, items);
        });

      if (index === serviceMetadata.functions.length - 1) {
        writtenTests
          .filter(
            ({ testTemplate: { serviceName, executeAfter } }) =>
              serviceName === serviceMetadata.serviceName && !executeAfter
          )
          .forEach((writtenTest) => {
            addCustomTest(writtenTest, items);
          });
      }
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
      name: appName + ' tests',
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
    process.cwd() + '/postman/' + appName.replace(/-/g, '_') + '_tests_postman_collection.json',
    JSON.stringify(postmanMetadata, null, 4)
  );
}
