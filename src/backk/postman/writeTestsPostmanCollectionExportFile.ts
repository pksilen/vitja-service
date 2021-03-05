import { getFileNamesRecursively } from '../utils/file/getSrcFilePathNameForTypeName';
import _ from 'lodash';
import YAML from 'yaml';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import serviceAnnotationContainer from '../decorators/service/serviceAnnotationContainer';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { sign } from 'jsonwebtoken';
import { Base64 } from 'js-base64';
import getServiceFunctionTests from './getServiceFunctionTests';
import getServiceFunctionTestArgument from './getServiceFunctionTestArgument';
import createPostmanCollectionItem from './createPostmanCollectionItem';
import addCustomTest from './addCustomTest';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import { FunctionMetadata } from '../metadata/types/FunctionMetadata';
import isReadFunction from '../service/crudentity/utils/isReadFunction';
import isUpdateFunction from '../service/crudentity/utils/isUpdateFunction';
import isDeleteFunction from '../service/crudentity/utils/isDeleteFunction';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import tryValidateIntegrationTests from './tryValidateIntegrationTests';
import { HttpStatusCodes } from '../constants/constants';

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
      return fileType === 'json' ? JSON.parse(testFileContents) : YAML.parse(testFileContents);
    })
  );

  tryValidateIntegrationTests(writtenTests, servicesMetadata);

  const executeAfterTests: { executeAfter: string; item: object }[] = [];
  const executeBeforeTests: { executeBefore: string; item: object }[] = [];

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) => {
    let updateCount = 0;

    if (
      serviceAnnotationContainer.hasNoAutoTestsAnnotationForServiceClass(
        (controller as any)[serviceMetadata.serviceName].constructor
      )
    ) {
      return;
    }

    let previousFunctionType: string;
    let lastGetFunctionMetadata: FunctionMetadata | undefined;
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata, index: number) => {
      writtenTests
        .filter(
          ({ testTemplate: { executeBefore } }) =>
            executeBefore === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((writtenTest) => {
          addCustomTest(writtenTest, controller, servicesMetadata, items);
        });

      executeBeforeTests
        .filter(
          ({ executeBefore }) =>
            executeBefore === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((test) => items.push(test.item));

      if (
        serviceFunctionAnnotationContainer.hasNoAutoTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) ||
        serviceFunctionAnnotationContainer.hasOnStartUp(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) ||
        serviceFunctionAnnotationContainer.isMetadataServiceFunction(
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

      const expectedResponseStatusCode = serviceFunctionAnnotationContainer.getResponseStatusCodeForServiceFunction(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      const expectedResponseFieldPathNameToFieldValueMapInTests = serviceFunctionAnnotationContainer.getExpectedResponseValueFieldPathNameToFieldValueMapForTests(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      if (
        isUpdateFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        updateCount++;
      }

      const tests = getServiceFunctionTests(
        (controller as any)[serviceMetadata.serviceName].constructor,
        (controller as any)[serviceMetadata.serviceName].Types,
        serviceMetadata,
        functionMetadata,
        false,
        expectedResponseStatusCode,
        expectedResponseFieldPathNameToFieldValueMapInTests
      );

      let isUpdate = false;
      const isVoidFunction = getTypeInfoForTypeName(functionMetadata.returnValueType).isNull;

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

        if (lastGetFunctionMetadata === undefined && isVoidFunction) {
          throw new Error(
            'There must be a get function defined before update/modify/change function in: ' +
              serviceMetadata.serviceName
          );
        }
      }

      const sampleArg = getServiceFunctionTestArgument(
        (controller as any)[serviceMetadata.serviceName].constructor,
        (controller as any)[serviceMetadata.serviceName].Types,
        functionMetadata.functionName,
        functionMetadata.argType,
        serviceMetadata,
        isUpdate,
        updateCount
      );

      const item = createPostmanCollectionItem(
        (controller as any)[serviceMetadata.serviceName].constructor,
        serviceMetadata,
        functionMetadata,
        sampleArg,
        tests
      );

      const executeBefore = serviceFunctionAnnotationContainer.getTestBefore(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      const executeAfter = serviceFunctionAnnotationContainer.getTestAfter(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      if (executeBefore) {
        executeBeforeTests.push({
          executeBefore,
          item
        });
      } else if (executeAfter) {
        executeAfterTests.push({
          executeAfter,
          item
        });
      } else {
        items.push(item);
      }

      if (isUpdate && isVoidFunction && lastGetFunctionMetadata) {
        const foundCustomTest = writtenTests.find(
          ({ testTemplate: { serviceFunctionName, executeAfter } }) =>
            serviceFunctionName ===
              serviceMetadata.serviceName + '.' + lastGetFunctionMetadata?.functionName &&
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        );

        if (!foundCustomTest) {
          const expectedResponseFieldPathNameToFieldValueMapInTests = serviceFunctionAnnotationContainer.getExpectedResponseValueFieldPathNameToFieldValueMapForTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            lastGetFunctionMetadata.functionName
          );

          const expectedEntityFieldPathNameToFieldValueMapInTests = serviceFunctionAnnotationContainer.getExpectedEntityFieldPathNameToFieldValueMapForTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            functionMetadata.functionName
          );

          const finalExpectedFieldPathNameToFieldValueMapInTests = {
            ...(expectedResponseFieldPathNameToFieldValueMapInTests ?? {}),
            ...(expectedEntityFieldPathNameToFieldValueMapInTests ?? {})
          };

          const getFunctionTests = getServiceFunctionTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            serviceMetadata,
            lastGetFunctionMetadata,
            true,
            HttpStatusCodes.SUCCESS,
            finalExpectedFieldPathNameToFieldValueMapInTests,
            Object.keys(finalExpectedFieldPathNameToFieldValueMapInTests).length > 0 ? undefined: sampleArg
          );

          const getFunctionSampleArg = getServiceFunctionTestArgument(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            lastGetFunctionMetadata.functionName,
            lastGetFunctionMetadata.argType,
            serviceMetadata,
            isUpdate,
            1,
            sampleArg
          );

          const item = createPostmanCollectionItem(
            (controller as any)[serviceMetadata.serviceName].constructor,
            serviceMetadata,
            lastGetFunctionMetadata,
            getFunctionSampleArg,
            getFunctionTests
          );

          if (executeBefore) {
            executeBeforeTests.push({
              executeBefore,
              item
            });
          } else if (executeAfter) {
            executeAfterTests.push({
              executeAfter,
              item
            });
          } else {
            items.push(item);
          }
        }
      }

      if (
        isDeleteFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) &&
        index === serviceMetadata.functions.length - 1 &&
        lastGetFunctionMetadata
      ) {
        const expectedResponseFieldPathNameToFieldValueMapInTests = serviceFunctionAnnotationContainer.getExpectedResponseValueFieldPathNameToFieldValueMapForTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          lastGetFunctionMetadata.functionName
        );

        const getFunctionTests = getServiceFunctionTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          lastGetFunctionMetadata,
          false,
          HttpStatusCodes.NOT_FOUND,
          expectedResponseFieldPathNameToFieldValueMapInTests
        );

        const getFunctionSampleArg = getServiceFunctionTestArgument(
          (controller as any)[serviceMetadata.serviceName].constructor,
          (controller as any)[serviceMetadata.serviceName].Types,
          lastGetFunctionMetadata.functionName,
          lastGetFunctionMetadata.argType,
          serviceMetadata,
          true
        );

        items.push(
          createPostmanCollectionItem(
            (controller as any)[serviceMetadata.serviceName].constructor,
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
          addCustomTest(writtenTest, controller, servicesMetadata, items);
        });

      executeAfterTests
        .filter(
          ({ executeAfter }) =>
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((test) => items.push(test.item));

      if (index === serviceMetadata.functions.length - 1) {
        writtenTests
          .filter(
            ({ testTemplate: { serviceFunctionName, executeAfter } }) =>
              serviceFunctionName.split('.')[0] === serviceMetadata.serviceName && !executeAfter
          )
          .forEach((writtenTest) => {
            addCustomTest(writtenTest, controller, servicesMetadata, items);
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
