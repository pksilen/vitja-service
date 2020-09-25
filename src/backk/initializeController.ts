import { getFromContainer, MetadataStorage, ValidationTypes } from 'class-validator';
import { Type } from 'class-transformer';
import _ from 'lodash';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import generateServicesMetadata, { FunctionMetadata, ServiceMetadata } from './generateServicesMetadata';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import setPropertyTypeValidationDecorators from './setPropertyTypeValidationDecorators';
import testValueContainer from './testValueContainer';
import getSrcFilenameForTypeName, { getFileNamesRecursively } from './getSrcFilenameForTypeName';
import getServiceTypeNames from './getServiceTypeNames';
import getValidationConstraint from './getValidationConstraint';
import BaseService from './BaseService';

function setNestedTypeAndValidationDecorators(
  typeClass: Function,
  targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean }
) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  validationMetadatas.forEach((validationMetadata: ValidationMetadata) => {
    if (validationMetadata.type === 'isInstance') {
      const nestedValidationMetadataArgs: ValidationMetadataArgs = {
        type: ValidationTypes.NESTED_VALIDATION,
        target: validationMetadata.target,
        propertyName: validationMetadata.propertyName,
        validationOptions: { each: validationMetadata.each }
      };

      if (
        !targetAndPropNameToHasNestedValidationMap[
          (validationMetadata.target as Function).name + validationMetadata.propertyName
        ]
      ) {
        Type(() => validationMetadata.constraints[0])(
          new (validationMetadata.target as new () => any)(),
          validationMetadata.propertyName
        );

        getFromContainer(MetadataStorage).addValidationMetadata(
          new ValidationMetadata(nestedValidationMetadataArgs)
        );

        targetAndPropNameToHasNestedValidationMap[
          (validationMetadata.target as Function).name + validationMetadata.propertyName
        ] = true;
      }
    }
  });
}

function getSampleArg(
  serviceTypes: { [key: string]: Function },
  argTypeName: string,
  serviceMetadata: ServiceMetadata,
  isUpdate: boolean
): object | undefined {
  const sampleArg: { [key: string]: any } = {};
  const typeProperties = serviceMetadata.types[argTypeName];
  const types = serviceMetadata.types;
  const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
  const serviceEntityName =
    serviceBaseName.charAt(serviceBaseName.length - 1) === 's'
      ? serviceBaseName.slice(0, -1)
      : serviceBaseName;

  if (typeProperties === undefined) {
    return undefined;
  }

  Object.entries(typeProperties).forEach(([propertyName, propertyTypeName]: [string, string]) => {
    const isOptionalProperty = propertyTypeName.startsWith('?');
    let finalPropertyTypeName = isOptionalProperty ? propertyTypeName.slice(1) : propertyTypeName;

    const propertyTypeNameAndDefaultValue = finalPropertyTypeName.split(' = ');
    // noinspection ReuseOfLocalVariableJS
    finalPropertyTypeName = propertyTypeNameAndDefaultValue[0];
    const defaultValue = propertyTypeNameAndDefaultValue[1];
    if (isOptionalProperty && defaultValue === undefined) {
      return;
    }

    const finalPropertyTypeNameWithoutArraySuffix = finalPropertyTypeName.endsWith('[]')
      ? finalPropertyTypeName.slice(0, -2)
      : finalPropertyTypeName;

    const testValue = testValueContainer.getTestValue(serviceTypes[argTypeName], propertyName);
    const minValue = getValidationConstraint(serviceTypes[argTypeName], propertyName, 'min');
    const maxValue = getValidationConstraint(serviceTypes[argTypeName], propertyName, 'max');

    if (testValue !== undefined) {
      sampleArg[propertyName] = testValue;
    } else if (propertyName === '_id') {
      sampleArg[propertyName] = `{{${serviceEntityName}Id}}`;
    } else if (propertyName === '_ids') {
      sampleArg[propertyName] = `{{${serviceEntityName}Id}}`;
    } else if (propertyName.endsWith('Id')) {
      sampleArg[propertyName] = `{{${propertyName}}}`;
    } else if (propertyName === 'id') {
      sampleArg[propertyName] = '123';
    } else if (finalPropertyTypeName.startsWith('integer') || finalPropertyTypeName.startsWith('bigint')) {
      sampleArg[propertyName] = isUpdate ? maxValue : minValue;
    } else if (finalPropertyTypeName.startsWith('number')) {
      sampleArg[propertyName] = isUpdate ? parseFloat(maxValue.toFixed(2)) : parseFloat(minValue.toFixed(2));
    } else if (finalPropertyTypeName.startsWith('boolean')) {
      sampleArg[propertyName] = !isUpdate;
    } else if (finalPropertyTypeName.startsWith('string')) {
      sampleArg[propertyName] = isUpdate ? 'abcd' : 'abc';
    } else if (finalPropertyTypeName.startsWith('(')) {
      const enumValues = finalPropertyTypeName.slice(1).split(/[|)]/);
      if (isUpdate && enumValues.length >= 3) {
        sampleArg[propertyName] =
          enumValues[1][0] === "'"
            ? enumValues[1].split("'")[1]
            : enumValues[1].includes('.')
            ? parseFloat(enumValues[1])
            : parseInt(enumValues[1]);
      } else {
        sampleArg[propertyName] =
          enumValues[0][0] === "'"
            ? enumValues[0].split("'")[1]
            : enumValues[0].includes('.')
            ? parseFloat(enumValues[0])
            : parseInt(enumValues[0]);
      }
    } else if (types[finalPropertyTypeNameWithoutArraySuffix]) {
      sampleArg[propertyName] = getSampleArg(
        serviceTypes,
        finalPropertyTypeNameWithoutArraySuffix,
        serviceMetadata,
        isUpdate
      );
    }

    if (finalPropertyTypeName.endsWith('[]')) {
      sampleArg[propertyName] =
        defaultValue === undefined ? [sampleArg[propertyName]] : JSON.parse(defaultValue);
    }
  });

  return sampleArg;
}

function getReturnValueTests(
  serviceTypes: { [key: string]: Function },
  returnValueTypeName: string,
  serviceMetadata: ServiceMetadata,
  responsePath: string,
  isOptional: boolean,
  isUpdate: boolean,
  sampleArg: object | undefined
): string[] {
  const returnValueMetadata = serviceMetadata.types[returnValueTypeName];
  const types = serviceMetadata.types;
  const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
  const serviceEntityName =
    serviceBaseName.charAt(serviceBaseName.length - 1) === 's'
      ? serviceBaseName.slice(0, -1)
      : serviceBaseName;

  let javascriptLines =
    responsePath === '[0].' || responsePath === '.' ? ['const response = pm.response.json();'] : [];

  Object.entries(returnValueMetadata).forEach(([propertyName, propertyTypeName]) => {
    if (sampleArg && (sampleArg as any)[propertyName] === undefined) {
      return;
    }

    const isOptionalProperty = propertyTypeName.startsWith('?') || isOptional;
    const isArray = propertyTypeName.endsWith('[]');
    let finalPropertyTypeName = propertyTypeName;

    if (isArray) {
      finalPropertyTypeName = propertyTypeName.slice(0, -2);
    }

    let expectedValue: any;
    let allowAnyValue;

    const testValue = testValueContainer.getTestValue(serviceTypes[returnValueTypeName], propertyName);

    const expectAnyTestValue = testValueContainer.getExpectAnyTestValue(
      serviceTypes[returnValueTypeName],
      propertyName
    );

    const testValueToMatch = testValueContainer.getTestValueToMatch(
      serviceTypes[returnValueTypeName],
      propertyName
    );

    const minValue = getValidationConstraint(serviceTypes[returnValueTypeName], propertyName, 'min');
    const maxValue = getValidationConstraint(serviceTypes[returnValueTypeName], propertyName, 'max');

    if (testValue !== undefined) {
      if (typeof testValue === 'string') {
        expectedValue = "'" + testValue + "'";
      } else {
        expectedValue = testValue;
      }
    } else if (expectAnyTestValue !== undefined) {
      allowAnyValue = true;
    } else if (propertyName === '_id') {
      expectedValue = `pm.collectionVariables.get('${serviceEntityName}Id')`;
    } else if (propertyName.endsWith('Id')) {
      expectedValue = `pm.collectionVariables.get('${propertyName}')`;
    } else if (propertyName === 'id') {
      expectedValue = "'123'";
    } else {
      switch (finalPropertyTypeName) {
        case 'string':
          expectedValue = isUpdate ? "'abcd'" : "'abc'";
          break;
        case 'boolean':
          expectedValue = !isUpdate;
          break;
        case 'integer':
        case 'bigint':
          expectedValue = isUpdate ? maxValue : minValue;
          break;
        case 'number':
          expectedValue = isUpdate ? parseFloat(maxValue.toFixed(2)) : parseFloat(minValue.toFixed(2));
          break;
      }
    }

    if (finalPropertyTypeName.startsWith('(')) {
      const enumValues = finalPropertyTypeName.slice(1).split(/[|)]/);
      expectedValue = isUpdate && enumValues.length >= 3 ? enumValues[1] : enumValues[0];
    } else if (types[finalPropertyTypeName]) {
      const finalResponsePath = responsePath + propertyName + (isArray ? '[0]' : '') + '.';
      //if (!isOptionalProperty) {
      const returnValueTests = getReturnValueTests(
        serviceTypes,
        finalPropertyTypeName,
        serviceMetadata,
        finalResponsePath,
        isOptional,
        isUpdate,
        sampleArg ? (sampleArg as any)[propertyName] : undefined
      );
      javascriptLines = javascriptLines.concat(returnValueTests);
      return javascriptLines;
      // }
    }

    let expectation;
    if (testValueToMatch) {
      const expectedValue = testValueToMatch.replace(
        new RegExp(propertyName, 'g'),
        `response${responsePath}${propertyName}`
      );
      expectation = `pm.expect(${expectedValue}).to.eql(true);`;
    } else {
      expectation = `pm.expect(response${responsePath}${propertyName}).to.eql(${expectedValue});`;
    }

    if (!allowAnyValue) {
      if (isOptionalProperty) {
        if (isArray) {
          javascriptLines.push(
            `pm.test("response${responsePath}${propertyName}", function () {
  if (response${responsePath}${propertyName} !== undefined) 
    return pm.expect(response${responsePath}${propertyName}).to.have.members([${expectedValue}]);
  else 
    return true; 
})`
          );
        } else {
          javascriptLines.push(
            `pm.test("response${responsePath}${propertyName}", function () {
  if (response${responsePath}${propertyName} !== undefined) 
   return ${expectation}
  else 
    return true; 
})`
          );
        }
      } else {
        if (isArray) {
          javascriptLines.push(
            `pm.test("response${responsePath}${propertyName}", function () {
  pm.expect(response${responsePath}${propertyName}).to.have.members([${expectedValue}]); 
})`
          );
        } else {
          javascriptLines.push(
            `pm.test("response${responsePath}${propertyName}", function () {
  ${expectation}
})`
          );
        }
      }
    }
  });

  return javascriptLines;
}

function getTests(
  serviceTypes: { [key: string]: Function },
  serviceMetadata: ServiceMetadata,
  functionMetadata: FunctionMetadata,
  isUpdate: boolean,
  expectedResponseStatusCode = 200,
  sampleArg: object | undefined = undefined
): object | undefined {
  const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
  const serviceEntityName =
    serviceBaseName.charAt(serviceBaseName.length - 1) === 's'
      ? serviceBaseName.slice(0, -1)
      : serviceBaseName;

  let returnValueTypeName = functionMetadata.returnValueType.split('|')[0].trim();
  const isArray = returnValueTypeName.endsWith('[]');

  if (isArray) {
    returnValueTypeName = returnValueTypeName.slice(0, -2);
  }

  const checkResponseCode = `pm.test("Status code is ${expectedResponseStatusCode}", function () {
  pm.response.to.have.status(${expectedResponseStatusCode});
});`;

  if (returnValueTypeName === 'Id') {
    return {
      id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
      listen: 'test',
      script: {
        id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
        exec: [
          checkResponseCode,
          'const response = pm.response.json()',
          `pm.collectionVariables.set("${serviceEntityName}Id", response._id)`
        ]
      }
    };
  }

  return {
    id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
    listen: 'test',
    script: {
      id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
      exec:
        returnValueTypeName === 'void' || expectedResponseStatusCode !== 200
          ? [checkResponseCode]
          : [
              checkResponseCode,
              ...getReturnValueTests(
                serviceTypes,
                returnValueTypeName,
                serviceMetadata,
                isArray ? '[0].' : '.',
                true,
                isUpdate,
                sampleArg
              )
            ]
    }
  };
}

function createPostmanCollectionItem(
  serviceMetadata: ServiceMetadata,
  functionMetadata: FunctionMetadata,
  sampleArg: object | undefined,
  tests: object | undefined
) {
  return {
    name: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
    request: {
      method: 'POST',
      header:
        sampleArg === undefined
          ? []
          : [
              {
                key: 'Content-Type',
                name: 'Content-Type',
                value: 'application/json',
                type: 'text'
              }
            ],
      body:
        sampleArg === undefined
          ? undefined
          : {
              mode: 'raw',
              raw: JSON.stringify(sampleArg, null, 4),
              options: {
                raw: {
                  language: 'json'
                }
              }
            },
      url: {
        raw: 'http://localhost:3000/' + serviceMetadata.serviceName + '.' + functionMetadata.functionName,
        protocol: 'http',
        host: ['localhost'],
        port: '3000',
        path: [serviceMetadata.serviceName + '.' + functionMetadata.functionName]
      }
    },
    response: [],
    event: tests ? [tests] : undefined
  };
}

function createPostmanCollectionItemFromWrittenTest({
  testTemplate: { testTemplateName, serviceName, functionName, functionArgument, response }
}: any) {
  const checkResponseCode = response.statusCode
    ? `pm.test("Status code is ${response.statusCode} OK", function () {
  pm.response.to.have.status(${response.statusCode});
});`
    : '';

  return {
    name: testTemplateName,
    request: {
      method: 'POST',
      header:
        functionArgument === undefined
          ? []
          : [
              {
                key: 'Content-Type',
                name: 'Content-Type',
                value: 'application/json',
                type: 'text'
              }
            ],
      body:
        functionArgument === undefined
          ? undefined
          : {
              mode: 'raw',
              raw: JSON.stringify(functionArgument, null, 4),
              options: {
                raw: {
                  language: 'json'
                }
              }
            },
      url: {
        raw: 'http://localhost:3000/' + serviceName + '.' + functionName,
        protocol: 'http',
        host: ['localhost'],
        port: '3000',
        path: [serviceName + '.' + functionName]
      }
    },
    response: [],
    event: [
      {
        id: serviceName + '.' + functionName,
        listen: 'test',
        script: {
          id: serviceName + '.' + functionName,
          exec: [
            checkResponseCode,
            'const response = pm.response.json();',
            ...(response.tests
              ? response.tests.map(
                  (test: any) =>
                    `pm.test("${test.name}", function () {
  ${test.exec.join('\n  ')} 
})`
                )
              : [])
          ]
        }
      }
    ]
  };
}

function addWrittenTest(writtenTest: any, items: any[]) {
  if (writtenTest.tests) {
    writtenTest.tests.forEach((test: any) => {
      const instantiatedWrittenTest = _.cloneDeepWith(writtenTest, (value: any) => {
        let newValue = value;
        Object.entries(test.testValues || {}).forEach(([key, value]: [string, any]) => {
          if (Array.isArray(value)) {
            Array(2)
              .fill(0)
              .forEach((_, index) => {
                if (newValue === `{{${key}[${index}]}}`) {
                  newValue = value[index];
                }
                if (typeof newValue === 'string' && newValue.includes(`{{${key}[${index}]}}`)) {
                  newValue = newValue.replace(`{{${key}[${index}]}}`, value[index]);
                }
              });
          } else {
            if (newValue === `{{${key}}}`) {
              newValue = value;
            }
            if (typeof newValue === 'string' && newValue.includes(`{{${key}}}`)) {
              newValue = newValue.replace(`{{${key}}}`, value);
            }
          }
        });
        return newValue === value ? undefined : newValue;
      });

      Object.keys(instantiatedWrittenTest.testTemplate.functionArgument || {}).forEach(
        (argumentKey: string) => {
          let isArgumentTemplateReplaced = false;

          Object.entries(test.testValues || {}).forEach(([key, value]: [string, any]) => {
            if (argumentKey === `{{${key}[0]}}`) {
              const argumentValue = instantiatedWrittenTest.testTemplate.functionArgument[argumentKey];
              delete instantiatedWrittenTest.testTemplate.functionArgument[argumentKey];
              instantiatedWrittenTest.testTemplate.functionArgument[value[0]] = argumentValue;
              isArgumentTemplateReplaced = true;
            }
          });

          if (!isArgumentTemplateReplaced && argumentKey.startsWith('{{') && argumentKey.endsWith('}}')) {
            delete instantiatedWrittenTest.testTemplate.functionArgument[argumentKey];
          }
        }
      );

      instantiatedWrittenTest.testTemplate.testTemplateName =
        instantiatedWrittenTest.testTemplate.testTemplateName + ' (' + test.testName + ')';

      items.push(createPostmanCollectionItemFromWrittenTest(instantiatedWrittenTest));
    });
  } else {
    items.push(createPostmanCollectionItemFromWrittenTest(writtenTest));
  }
}

function writePostmanCollectionExportFile<T>(controller: T, servicesMetadata: ServiceMetadata[]) {
  const items: any[] = [];
  let lastGetFunctionMetadata: FunctionMetadata;
  const testFilePathNames = getFileNamesRecursively(process.cwd() + '/integrationtests');
  const writtenTests = _.flatten(
    testFilePathNames.map((testFilePathName) => {
      const testFileContents = readFileSync(testFilePathName, { encoding: 'UTF-8' });
      return JSON.parse(testFileContents);
    })
  );

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) =>
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata, index: number) => {
      if (
        functionMetadata.functionName.startsWith('get') ||
        functionMetadata.functionName.startsWith('find') ||
        functionMetadata.functionName.startsWith('read') ||
        functionMetadata.functionName.startsWith('fetch') ||
        functionMetadata.functionName.startsWith('retrieve')
      ) {
        lastGetFunctionMetadata = functionMetadata;
      }

      const tests = getTests(
        (controller as any)[serviceMetadata.serviceName].Types,
        serviceMetadata,
        functionMetadata,
        false
      );

      let isUpdate = false;
      if (
        functionMetadata.functionName.startsWith('update') ||
        functionMetadata.functionName.startsWith('modify') ||
        functionMetadata.functionName.startsWith('change')
      ) {
        isUpdate = true;
        if (lastGetFunctionMetadata === undefined) {
          throw new Error(
            'There must be a get function defined before update/modify/change function in: ' +
              serviceMetadata.serviceName
          );
        }
      }

      const sampleArg = getSampleArg(
        (controller as any)[serviceMetadata.serviceName].Types,
        functionMetadata.argType,
        serviceMetadata,
        isUpdate
      );

      items.push(createPostmanCollectionItem(serviceMetadata, functionMetadata, sampleArg, tests));

      if (isUpdate) {
        const getFunctionTests = getTests(
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          lastGetFunctionMetadata,
          true,
          200,
          sampleArg
        );

        const getFunctionSampleArg = getSampleArg(
          (controller as any)[serviceMetadata.serviceName].Types,
          lastGetFunctionMetadata.argType,
          serviceMetadata,
          isUpdate
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
        (functionMetadata.functionName.startsWith('delete') ||
          functionMetadata.functionName.startsWith('remove') ||
          functionMetadata.functionName.startsWith('erase')) &&
        index === serviceMetadata.functions.length - 1
      ) {
        const getFunctionTests = getTests(
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceMetadata,
          lastGetFunctionMetadata,
          false,
          404
        );

        const getFunctionSampleArg = getSampleArg(
          (controller as any)[serviceMetadata.serviceName].Types,
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
          addWrittenTest(writtenTest, items);
        });

      if (index === serviceMetadata.functions.length - 1) {
        writtenTests
          .filter(
            ({ testTemplate: { serviceName, executeAfter } }) =>
              serviceName === serviceMetadata.serviceName && !executeAfter
          )
          .forEach((writtenTest) => {
            addWrittenTest(writtenTest, items);
          });
      }
    })
  );

  const cwd = process.cwd();
  const appName = cwd.split('/').reverse()[0];

  const postmanMetadata = {
    info: {
      name: appName,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
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

  writeFileSync(process.cwd() + '/postman/postman_collection.json', JSON.stringify(postmanMetadata, null, 4));
}

export default function initializeController(controller: any) {
  Object.entries(controller).forEach(([serviceName, service]: [string, any]) => {
    if (!(service instanceof BaseService)) {
      throw new Error('Service: ' + serviceName + ' must be extended from BaseService');
    }
    if (serviceName === 'metadataService') {
      throw new Error('metadataService is a reserved internal service name.');
    } else if (serviceName === 'livenessCheckService') {
      throw new Error('livenessCheckService is a reserved internal service name.');
    }

    const [functionNameToParamTypeNameMap, functionNameToReturnTypeNameMap] = getServiceTypeNames(
      serviceName,
      getSrcFilenameForTypeName(serviceName.charAt(0).toUpperCase() + serviceName.slice(1))
    );

    controller[`${serviceName}Types`] = {
      functionNameToParamTypeNameMap,
      functionNameToReturnTypeNameMap
    };
  });

  generateServicesMetadata(controller);

  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object' && value.constructor !== Object)
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      Object.entries(controller[serviceName].Types ?? {}).forEach(([, typeClass]: [string, any]) => {
        setPropertyTypeValidationDecorators(typeClass, serviceName, controller[serviceName].Types);
        setNestedTypeAndValidationDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
      }, {});
    });

  const servicesMetadata = generateServicesMetadata(controller);
  controller.servicesMetadata = servicesMetadata;

  if (process.env.NODE_ENV === 'development') {
    writePostmanCollectionExportFile(controller, servicesMetadata);
  }
}
