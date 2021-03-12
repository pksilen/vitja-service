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
import isCreateFunction from '../service/crudentity/utils/isCreateFunction';

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
    let createFunctionMetadata: FunctionMetadata | undefined;
    // noinspection FunctionWithMoreThanThreeNegationsJS,FunctionWithMoreThanThreeNegationsJS,OverlyComplexFunctionJS,FunctionTooLongJS
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata, index: number) => {
      writtenTests
        .filter(
          ({ testTemplate: { executeBefore } }) =>
            executeBefore === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((writtenTest) => {
          addCustomTest(writtenTest, controller, servicesMetadata, items);
        });

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

      const serviceFunctionsToExecute = serviceFunctionAnnotationContainer.getTestSetup(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      serviceFunctionsToExecute?.forEach((serviceFunction) => {
        const [serviceName, functionName] = serviceFunction.split('.');

        const foundServiceMetadata = servicesMetadata.find(
          (serviceMetadata) => serviceMetadata.serviceName === serviceName
        );

        const foundFunctionMetadata = foundServiceMetadata?.functions.find(func => func.functionName === functionName);

        if (!foundServiceMetadata || !foundFunctionMetadata) {
          throw new Error(
            'Invalid service function name in @TestSetup annotation in ' +
              serviceMetadata.serviceName +
              '.' +
              functionMetadata.functionName
          );
        }

        const expectedResponseStatusCode = serviceFunctionAnnotationContainer.getResponseStatusCodeForServiceFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        );

        const expectedResponseFieldPathNameToFieldValueMapInTests = serviceFunctionAnnotationContainer.getExpectedResponseValueFieldPathNameToFieldValueMapForTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        );

        const tests = getServiceFunctionTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          functionMetadata,
          false,
          expectedResponseStatusCode,
          expectedResponseFieldPathNameToFieldValueMapInTests
        );

        const sampleArg = getServiceFunctionTestArgument(
          (controller as any)[serviceMetadata.serviceName].constructor,
          (controller as any)[serviceMetadata.serviceName].Types,
          functionMetadata.functionName,
          functionMetadata.argType,
          serviceMetadata,
          false
        );

        const item = createPostmanCollectionItem(
          (controller as any)[serviceMetadata.serviceName].constructor,
          serviceMetadata,
          functionMetadata,
          sampleArg,
          tests
        );

        items.push(item);
      });

      if (
        isCreateFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        createFunctionMetadata = functionMetadata;
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
      const updateType = serviceFunctionAnnotationContainer.getUpdateTypeForServiceFunction(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      if (
        isUpdateFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) &&
        updateType === 'addOrRemoveSubEntities' &&
        !serviceFunctionAnnotationContainer.getTestSpec(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        throw new Error(
          'There must be a test specified using @TestEntityAfterwards annotation for service function: ' +
            serviceMetadata.serviceName
        );
      }

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

      items.push(item);

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

          const testSpec = serviceFunctionAnnotationContainer.getTestSpec(
            (controller as any)[serviceMetadata.serviceName].constructor,
            functionMetadata.functionName
          );

          const finalExpectedFieldPathNameToFieldValueMapInTests = {
            ...(expectedResponseFieldPathNameToFieldValueMapInTests ?? {}),
            ...(testSpec?.fieldPathNameToFieldValueMap ?? {})
          };

          const expectedFieldPathNameCount = Object.keys(finalExpectedFieldPathNameToFieldValueMapInTests)
            .length;

          const getFunctionTests = getServiceFunctionTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            serviceMetadata,
            lastGetFunctionMetadata,
            expectedFieldPathNameCount <= 0,
            HttpStatusCodes.SUCCESS,
            finalExpectedFieldPathNameToFieldValueMapInTests,
            expectedFieldPathNameCount > 0 ? undefined : sampleArg
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
            getFunctionTests,
            testSpec?.testName
          );

          items.push(item);
        }
      }

      if (
        isDeleteFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        ) &&
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

        const itemName = _.startCase(serviceMetadata.serviceName.split('Service')[0]).toLowerCase();

        items.push(
          createPostmanCollectionItem(
            (controller as any)[serviceMetadata.serviceName].constructor,
            serviceMetadata,
            lastGetFunctionMetadata,
            getFunctionSampleArg,
            getFunctionTests,
            `expect ${itemName} not to be found`
          )
        );

        if (
          index !== serviceMetadata.functions.length - 1 &&
          isDeleteFunction(
            (controller as any)[serviceMetadata.serviceName].constructor,
            serviceMetadata.functions[index + 1].functionName
          ) &&
          createFunctionMetadata
        ) {
          const createFunctionTests = getServiceFunctionTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            serviceMetadata,
            createFunctionMetadata,
            false,
            undefined,
            expectedResponseFieldPathNameToFieldValueMapInTests
          );

          const createFunctionSampleArg = getServiceFunctionTestArgument(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            createFunctionMetadata.functionName,
            createFunctionMetadata.argType,
            serviceMetadata
          );

          items.push(
            createPostmanCollectionItem(
              (controller as any)[serviceMetadata.serviceName].constructor,
              serviceMetadata,
              createFunctionMetadata,
              createFunctionSampleArg,
              createFunctionTests
            )
          );
        }
      }

      writtenTests
        .filter(
          ({ testTemplate: { executeAfter } }) =>
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((writtenTest) => {
          addCustomTest(writtenTest, controller, servicesMetadata, items);
        });

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
