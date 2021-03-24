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
import tryValidateIntegrationTests from './tryValidateIntegrationTests';
import { HttpStatusCodes } from '../constants/constants';
import isCreateFunction from '../service/crudentity/utils/isCreateFunction';
import CrudEntityService from '../service/crudentity/CrudEntityService';

export default function writeTestsPostmanCollectionExportFile<T>(
  controller: T,
  servicesMetadata: ServiceMetadata[]
) {
  let items: any[] = [];
  const itemGroups: object[] = [];
  const testFilePathNames = getFileNamesRecursively(process.cwd() + '/integrationtests');

  const writtenTests = _.flatten(
    testFilePathNames.map((testFilePathName) => {
      const testFileContents = readFileSync(testFilePathName, { encoding: 'UTF-8' });
      const fileType = testFilePathName.endsWith('json') ? 'json' : 'yaml';
      return fileType === 'json' ? JSON.parse(testFileContents) : YAML.parse(testFileContents);
    })
  );

  tryValidateIntegrationTests(writtenTests, servicesMetadata);

  servicesMetadata
    .filter(
      (serviceMetadata) => (controller as any)[serviceMetadata.serviceName] instanceof CrudEntityService
    )
    .forEach((serviceMetadata: ServiceMetadata) => {
      const foundDeleteAllFunction = serviceMetadata.functions.find(
        (func) =>
          func.functionName.startsWith('deleteAll') ||
          func.functionName.startsWith('destroyAll') ||
          func.functionName.startsWith('eraseAll')
      );

      if (foundDeleteAllFunction) {
        const tests = getServiceFunctionTests(
          (controller as any)[serviceMetadata.serviceName].constructor,
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          foundDeleteAllFunction,
          false
        );

        const sampleArg = getServiceFunctionTestArgument(
          (controller as any)[serviceMetadata.serviceName].constructor,
          (controller as any)[serviceMetadata.serviceName].Types,
          foundDeleteAllFunction.functionName,
          foundDeleteAllFunction.argType,
          serviceMetadata,
          false
        );

        const item = createPostmanCollectionItem(
          (controller as any)[serviceMetadata.serviceName].constructor,
          serviceMetadata,
          foundDeleteAllFunction,
          sampleArg,
          tests
        );

        items.push(item);
      }
    });

  itemGroups.push({
    name: 'Cleanup (0)',
    item: items.map((item, index) => ({ ...item, name: item.name + ` (0.${index + 1})` }))
  });

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata, serviceIndex) => {
    // noinspection ReuseOfLocalVariableJS
    const functionItemGroups: object[] = [];

    let updateCount = 0;

    if (
      serviceAnnotationContainer.hasNoAutoTestsAnnotationForServiceClass(
        (controller as any)[serviceMetadata.serviceName].constructor
      )
    ) {
      return;
    }

    let lastReadFunctionMetadata: FunctionMetadata | undefined;
    let createFunctionMetadata: FunctionMetadata | undefined;
    // noinspection FunctionWithMoreThanThreeNegationsJS,FunctionWithMoreThanThreeNegationsJS,OverlyComplexFunctionJS,FunctionTooLongJS
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata, functionIndex: number) => {
      // noinspection ReuseOfLocalVariableJS
      items = [];

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

      const testSetupServiceFunctionsOrSpecsToExecute = serviceFunctionAnnotationContainer.getTestSetup(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      testSetupServiceFunctionsOrSpecsToExecute?.forEach((serviceFunctionOrSpec, testSpecIndex) => {
        const [serviceName, functionName] =
          typeof serviceFunctionOrSpec === 'string'
            ? serviceFunctionOrSpec.split('.')
            : serviceFunctionOrSpec.serviceFunctionName.split('.');

        const foundServiceMetadata = servicesMetadata.find(
          (serviceMetadata) => serviceMetadata.serviceName === serviceName
        );

        const foundFunctionMetadata = foundServiceMetadata?.functions.find(
          (func) => func.functionName === functionName
        );

        if (!foundServiceMetadata || !foundFunctionMetadata) {
          throw new Error(
            'Invalid service function name in @TestSetup annotation in ' +
              serviceMetadata.serviceName +
              '.' +
              functionMetadata.functionName
          );
        }

        const expectedResponseStatusCode = serviceFunctionAnnotationContainer.getResponseStatusCodeForServiceFunction(
          (controller as any)[foundServiceMetadata.serviceName].constructor,
          foundFunctionMetadata.functionName
        );

        const expectedResponseFieldPathNameToFieldValueMapInTests = serviceFunctionAnnotationContainer.getExpectedResponseValueFieldPathNameToFieldValueMapForTests(
          (controller as any)[foundServiceMetadata.serviceName].constructor,
          foundFunctionMetadata.functionName
        );

        let tests;

        if (
          typeof serviceFunctionOrSpec === 'string' ||
          (typeof serviceFunctionOrSpec === 'object' && !serviceFunctionOrSpec.postmanTests)
        ) {
          tests = getServiceFunctionTests(
            (controller as any)[foundServiceMetadata.serviceName].constructor,
            (controller as any)[foundServiceMetadata.serviceName].Types,
            foundServiceMetadata,
            foundFunctionMetadata,
            false,
            expectedResponseStatusCode,
            expectedResponseFieldPathNameToFieldValueMapInTests
          );
        } else if (serviceFunctionOrSpec.postmanTests) {
          tests = {
            id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
            listen: 'test',
            script: {
              id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
              exec: [
                'const response = pm.response.json();',
                ...serviceFunctionOrSpec.postmanTests.map(
                  (test: string) =>
                    `pm.test("test", function () {
  ${test} 
})`
                )
              ]
            }
          };
        }

        const sampleArg = getServiceFunctionTestArgument(
          (controller as any)[foundServiceMetadata.serviceName].constructor,
          (controller as any)[foundServiceMetadata.serviceName].Types,
          foundFunctionMetadata.functionName,
          foundFunctionMetadata.argType,
          foundServiceMetadata,
          false
        );

        const item = createPostmanCollectionItem(
          (controller as any)[foundServiceMetadata.serviceName].constructor,
          foundServiceMetadata,
          foundFunctionMetadata,
          typeof serviceFunctionOrSpec === 'object' && serviceFunctionOrSpec.argument
            ? { ...sampleArg, ...serviceFunctionOrSpec.argument }
            : sampleArg,
          tests,
          typeof serviceFunctionOrSpec === 'object' ? serviceFunctionOrSpec?.setupStepName : undefined
        );

        items.push({ ...item, name: (testSpecIndex === 0 ? 'GIVEN ' : 'AND ') + item.name });
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
        lastReadFunctionMetadata = functionMetadata;
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

      const updateType = serviceFunctionAnnotationContainer.getUpdateTypeForServiceFunction(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      const isUpdate = isUpdateFunction(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      if (
        isUpdate &&
        updateType === 'addOrRemoveSubEntities' &&
        !serviceFunctionAnnotationContainer.getPostTestSpecs(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        throw new Error(
          'There must be a test specified using @PostTest annotation for service function: ' +
            serviceMetadata.serviceName
        );
      }

      const isDelete = isDeleteFunction(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      const sampleArg = getServiceFunctionTestArgument(
        (controller as any)[serviceMetadata.serviceName].constructor,
        (controller as any)[serviceMetadata.serviceName].Types,
        functionMetadata.functionName,
        functionMetadata.argType,
        serviceMetadata,
        isUpdate,
        updateCount
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

      const item = createPostmanCollectionItem(
        (controller as any)[serviceMetadata.serviceName].constructor,
        serviceMetadata,
        functionMetadata,
        sampleArg,
        tests
      );

      const testSpecs = serviceFunctionAnnotationContainer.getPostTestSpecs(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      if (testSetupServiceFunctionsOrSpecsToExecute || testSpecs) {
        items.push({ ...item, name: 'WHEN ' + item.name });
      } else {
        items.push(item);
      }

      if (isUpdate || isDelete) {
        const foundCustomTest = writtenTests.find(
          ({ testTemplate: { serviceFunctionName, executeAfter } }) =>
            serviceFunctionName ===
              serviceMetadata.serviceName + '.' + lastReadFunctionMetadata?.functionName &&
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        );

        testSpecs?.forEach((testSpec, testSpecIndex) => {
          const finalExpectedFieldPathNameToFieldValueMapInTests = {
            ...(expectedResponseFieldPathNameToFieldValueMapInTests ?? {}),
            ...(testSpec?.expectedResult ?? {})
          };

          if (testSpec?.serviceFunctionName) {
            const [serviceName, functionName] = testSpec.serviceFunctionName.split('.');

            const foundServiceMetadata = servicesMetadata.find(
              (serviceMetadata) => serviceMetadata.serviceName === serviceName
            );

            const foundFunctionMetadata = foundServiceMetadata?.functions.find(
              (func) => func.functionName === functionName
            );

            if (!foundServiceMetadata || !foundFunctionMetadata) {
              throw new Error(
                'Invalid service function name in @PostTest annotation in ' +
                  serviceMetadata.serviceName +
                  '.' +
                  functionMetadata.functionName
              );
            }

            const expectedResponseStatusCode = serviceFunctionAnnotationContainer.getResponseStatusCodeForServiceFunction(
              (controller as any)[foundServiceMetadata.serviceName].constructor,
              foundFunctionMetadata.functionName
            );

            const tearDownTests = getServiceFunctionTests(
              (controller as any)[foundServiceMetadata.serviceName].constructor,
              (controller as any)[foundServiceMetadata.serviceName].Types,
              foundServiceMetadata,
              foundFunctionMetadata,
              isUpdate,
              expectedResponseStatusCode,
              finalExpectedFieldPathNameToFieldValueMapInTests,
              isUpdate ? sampleArg : undefined
            );

            const tearDownSampleArg = getServiceFunctionTestArgument(
              (controller as any)[foundServiceMetadata.serviceName].constructor,
              (controller as any)[foundServiceMetadata.serviceName].Types,
              foundFunctionMetadata.functionName,
              foundFunctionMetadata.argType,
              foundServiceMetadata,
              true,
              1,
              isUpdate ? sampleArg : undefined
            );

            const item = createPostmanCollectionItem(
              (controller as any)[foundServiceMetadata.serviceName].constructor,
              foundServiceMetadata,
              foundFunctionMetadata,
              tearDownSampleArg,
              tearDownTests,
              testSpec.testName
            );

            items.push({ ...item, name: (testSpecIndex === 0 ? 'THEN ' : 'AND ') + item.name });
          }
        });

        if (!testSpecs && lastReadFunctionMetadata && !foundCustomTest) {
          const getFunctionTests = getServiceFunctionTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            serviceMetadata,
            lastReadFunctionMetadata,
            isUpdate,
            isUpdate ? HttpStatusCodes.SUCCESS : HttpStatusCodes.NOT_FOUND,
            expectedResponseFieldPathNameToFieldValueMapInTests,
            isUpdate ? sampleArg : undefined
          );

          const getFunctionSampleArg = getServiceFunctionTestArgument(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            lastReadFunctionMetadata.functionName,
            lastReadFunctionMetadata.argType,
            serviceMetadata,
            true,
            1,
            sampleArg
          );

          const itemName = _.startCase(serviceMetadata.serviceName.split('Service')[0]).toLowerCase();

          const item = createPostmanCollectionItem(
            (controller as any)[serviceMetadata.serviceName].constructor,
            serviceMetadata,
            lastReadFunctionMetadata,
            getFunctionSampleArg,
            getFunctionTests,
            isDelete ? `Expect: ${itemName} not to be found` : undefined
          );

          items.push(item);
        }
      }

      const testSetupServiceFunctionsToExecuteForNextFunction = serviceFunctionAnnotationContainer.getTestSetup(
        (controller as any)[serviceMetadata.serviceName].constructor,
        serviceMetadata.functions[functionIndex + 1]?.functionName
      );

      if (
        isDelete &&
        functionIndex !== serviceMetadata.functions.length - 1 &&
        isDeleteFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          serviceMetadata.functions[functionIndex + 1].functionName
        ) &&
        createFunctionMetadata &&
        !testSetupServiceFunctionsToExecuteForNextFunction
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

      writtenTests
        .filter(
          ({ testTemplate: { executeAfter } }) =>
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        )
        .forEach((writtenTest) => {
          addCustomTest(writtenTest, controller, servicesMetadata, items);
        });

      if (functionIndex === serviceMetadata.functions.length - 1) {
        writtenTests
          .filter(
            ({ testTemplate: { serviceFunctionName, executeAfter } }) =>
              serviceFunctionName.split('.')[0] === serviceMetadata.serviceName && !executeAfter
          )
          .forEach((writtenTest) => {
            addCustomTest(writtenTest, controller, servicesMetadata, items);
          });
      }

      functionItemGroups.push({
        name: functionMetadata.functionName + ` (${serviceIndex + 1}.${functionIndex + 1})`,
        item: items.map((item, index) => ({
          ...item,
          name: item.name + ` (${serviceIndex + 1}.${functionIndex + 1}.${index + 1})`
        }))
      });
    });

    itemGroups.push({
      name: serviceMetadata.serviceName + ` (${serviceIndex + 1})`,
      item: functionItemGroups
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
      ...itemGroups
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
