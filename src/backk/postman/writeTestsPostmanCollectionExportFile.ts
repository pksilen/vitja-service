import { getFileNamesRecursively } from "../utils/file/getSrcFilePathNameForTypeName";
import _ from "lodash";
import YAML from "yaml";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import serviceAnnotationContainer from "../decorators/service/serviceAnnotationContainer";
import serviceFunctionAnnotationContainer
  from "../decorators/service/function/serviceFunctionAnnotationContainer";
import { sign } from "jsonwebtoken";
import { Base64 } from "js-base64";
import getServiceFunctionTests from "./getServiceFunctionTests";
import getServiceFunctionTestArgument from "./getServiceFunctionTestArgument";
import createPostmanCollectionItem from "./createPostmanCollectionItem";
import addCustomTest from "./addCustomTest";
import { ServiceMetadata } from "../metadata/types/ServiceMetadata";
import { FunctionMetadata } from "../metadata/types/FunctionMetadata";
import isReadFunction from "../service/crudentity/utils/isReadFunction";
import isUpdateFunction from "../service/crudentity/utils/isUpdateFunction";
import isDeleteFunction from "../service/crudentity/utils/isDeleteFunction";
import tryValidateIntegrationTests from "./tryValidateIntegrationTests";
import { HttpStatusCodes } from "../constants/constants";
import isCreateFunction from "../service/crudentity/utils/isCreateFunction";
import CrudEntityService from "../service/crudentity/CrudEntityService";

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

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) => {
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

      const testSetupServiceFunctionsToExecute = serviceFunctionAnnotationContainer.getTestSetup(
        (controller as any)[serviceMetadata.serviceName].constructor,
        functionMetadata.functionName
      );

      testSetupServiceFunctionsToExecute?.forEach((serviceFunction) => {
        const [serviceName, functionName] = serviceFunction.split('.');

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

        const tests = getServiceFunctionTests(
          (controller as any)[foundServiceMetadata.serviceName].constructor,
          (controller as any)[foundServiceMetadata.serviceName].Types,
          foundServiceMetadata,
          foundFunctionMetadata,
          false,
          expectedResponseStatusCode,
          expectedResponseFieldPathNameToFieldValueMapInTests
        );

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
        !serviceFunctionAnnotationContainer.getTestSpec(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        )
      ) {
        throw new Error(
          'There must be a test specified using @TestTeardown annotation for service function: ' +
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

      items.push(item);

      if (isUpdate || isDelete) {
        const foundCustomTest = writtenTests.find(
          ({ testTemplate: { serviceFunctionName, executeAfter } }) =>
            serviceFunctionName ===
              serviceMetadata.serviceName + '.' + lastReadFunctionMetadata?.functionName &&
            executeAfter === serviceMetadata.serviceName + '.' + functionMetadata.functionName
        );

        const testSpec = serviceFunctionAnnotationContainer.getTestSpec(
          (controller as any)[serviceMetadata.serviceName].constructor,
          functionMetadata.functionName
        );

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
              'Invalid service function name in @TestTeardown annotation in ' +
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

          items.push(item);
        } else if (lastReadFunctionMetadata && !foundCustomTest) {
          const getFunctionTests = getServiceFunctionTests(
            (controller as any)[serviceMetadata.serviceName].constructor,
            (controller as any)[serviceMetadata.serviceName].Types,
            serviceMetadata,
            lastReadFunctionMetadata,
            isUpdate,
            isUpdate ? HttpStatusCodes.SUCCESS : HttpStatusCodes.NOT_FOUND,
            finalExpectedFieldPathNameToFieldValueMapInTests,
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
            isDelete ? `expect ${itemName} not to be found` : undefined
          );

          items.push(item);
        }
      }

      const testSetupServiceFunctionsToExecuteForNextFunction = serviceFunctionAnnotationContainer.getTestSetup(
        (controller as any)[serviceMetadata.serviceName].constructor,
        serviceMetadata.functions[index + 1]?.functionName
      );

      if (
        isDelete &&
        index !== serviceMetadata.functions.length - 1 &&
        isDeleteFunction(
          (controller as any)[serviceMetadata.serviceName].constructor,
          serviceMetadata.functions[index + 1].functionName
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
