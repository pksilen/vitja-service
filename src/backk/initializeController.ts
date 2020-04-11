import { getFromContainer, MetadataStorage, ValidationTypes } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import generateServicesMetadata, { FunctionMetadata, ServiceMetadata } from './generateServicesMetadata';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import setPropertyTypeValidationDecorators from './setPropertyTypeValidationDecorators';
import testValueContainer from './testValueContainer';

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
  serviceBaseName: string,
  argTypeName: string,
  serviceMetadata: ServiceMetadata,
  isUpdate: boolean
): object | undefined {
  const sampleArg: { [key: string]: any } = {};
  const typeProperties = serviceMetadata.types[argTypeName];
  const types = serviceMetadata.types;
  const serviceEntityName =
    serviceBaseName.charAt(serviceBaseName.length - 1) === 's'
      ? serviceBaseName.slice(0, -1)
      : serviceBaseName;

  if (typeProperties === undefined) {
    return undefined;
  }

  Object.entries(typeProperties).map(([propertyName, propertyTypeName]: [string, string]) => {
    let finalPropertyTypeName = propertyTypeName.startsWith('?')
      ? propertyTypeName.slice(1)
      : propertyTypeName;

    const propertyTypeNameAndDefaultValue = finalPropertyTypeName.split(' = ');
    // noinspection ReuseOfLocalVariableJS
    finalPropertyTypeName = propertyTypeNameAndDefaultValue[0];
    const defaultValue = propertyTypeNameAndDefaultValue[1];

    const finalPropertyTypeNameWithoutArraySuffix = finalPropertyTypeName.endsWith('[]')
      ? finalPropertyTypeName.slice(0, -2)
      : finalPropertyTypeName;

    const testValue = testValueContainer.getTestValue(serviceTypes[argTypeName], propertyName);

    if (testValue !== undefined) {
      sampleArg[propertyName] = testValue;
    } else if (propertyName === '_id') {
      sampleArg[propertyName] = `{{${serviceEntityName}Id}}`;
    } else if (propertyName === '_ids') {
      sampleArg[propertyName] = `{{${serviceEntityName}Id}}`;
    } else if (propertyName.endsWith('Id')) {
      sampleArg[propertyName] = `{{${propertyName}}}`;
    } else if (finalPropertyTypeName.startsWith('integer')) {
      sampleArg[propertyName] =
        defaultValue === undefined ? (isUpdate ? 1234 : 123) : JSON.parse(defaultValue);
    } else if (finalPropertyTypeName.startsWith('number')) {
      sampleArg[propertyName] =
        defaultValue === undefined ? (isUpdate ? 1234.12 : 123.12) : JSON.parse(defaultValue);
    } else if (finalPropertyTypeName.startsWith('boolean')) {
      sampleArg[propertyName] = defaultValue === undefined ? !isUpdate : JSON.parse(defaultValue);
    } else if (finalPropertyTypeName.startsWith('string')) {
      sampleArg[propertyName] =
        defaultValue === undefined ? (isUpdate ? 'abcd' : 'abc') : JSON.parse(defaultValue);
    } else if (finalPropertyTypeName.startsWith('(')) {
      sampleArg[propertyName] =
        defaultValue === undefined
          ? finalPropertyTypeName
              .slice(1)
              .split(/[|)]/)[0]
              .split("'")[1]
          : JSON.parse(defaultValue);
    } else if (types[finalPropertyTypeNameWithoutArraySuffix]) {
      sampleArg[propertyName] = getSampleArg(
        serviceTypes,
        serviceBaseName,
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
  isUpdate: boolean
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

  Object.entries(returnValueMetadata).map(([propertyName, propertyTypeName]) => {
    const isOptionalProperty = propertyTypeName.startsWith('?') || isOptional;
    const isArray = propertyTypeName.endsWith('[]');
    let finalPropertyTypeName = propertyTypeName;

    if (isArray) {
      finalPropertyTypeName = propertyTypeName.slice(0, -2);
    }

    let expectedValue: any;
    let expectedType;

    const testValue = testValueContainer.getTestValue(serviceTypes[returnValueTypeName], propertyName);
    const testValueType = testValueContainer.getTestValueType(
      serviceTypes[returnValueTypeName],
      propertyName
    );

    if (testValue !== undefined) {
      if (typeof testValue === 'string') {
        expectedValue = "'" + testValue + "'";
      } else {
        expectedValue = testValue;
      }
    } else if (testValueType !== undefined) {
      expectedType = testValueType;
    } else if (propertyName === '_id') {
      expectedValue = `pm.collectionVariables.get('${serviceEntityName}Id')`;
    } else if (propertyName.endsWith('Id')) {
      expectedValue = `pm.collectionVariables.get('${propertyName}')`;
    } else {
      switch (finalPropertyTypeName) {
        case 'string':
          expectedValue = isUpdate ? "'abcd'" : "'abc'";
          break;
        case 'boolean':
          expectedValue = !isUpdate;
          break;
        case 'integer':
          expectedValue = isUpdate ? 1234 : 123;
          break;
        case 'number':
          expectedValue = isUpdate ? 1234.12 : 123.12;
          break;
      }
    }

    if (finalPropertyTypeName.startsWith('(')) {
      expectedValue = finalPropertyTypeName.slice(1).split(/[|)]/)[0];
    } else if (types[finalPropertyTypeName]) {
      const finalResponsePath = responsePath + propertyName + (isArray ? '[0]' : '') + '.';
      if (!isOptionalProperty) {
        const returnValueTests = getReturnValueTests(
          serviceTypes,
          finalPropertyTypeName,
          serviceMetadata,
          finalResponsePath,
          isOptional,
          isUpdate
        );
        javascriptLines = javascriptLines.concat(returnValueTests);
        return javascriptLines;
      }
    }

    const expectation =
      expectedType === undefined
        ? `pm.expect(response${responsePath}${propertyName}).to.eql(${expectedValue});`
        : `pm.expect(response${responsePath}${propertyName}).to.be.a('${expectedType}');`;

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
  });

  return javascriptLines;
}

function getTests(
  serviceTypes: { [key: string]: Function },
  serviceMetadata: ServiceMetadata,
  functionMetadata: FunctionMetadata,
  isUpdate: boolean,
  expectedResponseStatusCode = 200
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

  let isOptional = false;
  if (returnValueTypeName.startsWith('Partial<')) {
    returnValueTypeName = returnValueTypeName.slice(8, -1);
    isOptional = true;
  }

  const checkResponseCode = `pm.test("Status code is ${expectedResponseStatusCode} OK", function () {
      pm.response.to.have.status(${expectedResponseStatusCode});
    });`;

  if (returnValueTypeName === 'IdWrapper') {
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
                isOptional,
                isUpdate
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
    name: 'http://localhost:3000/' + serviceMetadata.serviceName + '.' + functionMetadata.functionName,
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

function writePostmanCollectionExportFile<T>(controller: T) {
  const servicesMetadata = generateServicesMetadata(controller);
  const items: any[] = [];
  let lastGetFunctionMetadata: FunctionMetadata;

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
            'There must be a get function defined before update function in: ' + serviceMetadata.serviceName
          );
        }
      }

      const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];

      const sampleArg = getSampleArg(
        (controller as any)[serviceMetadata.serviceName].Types,
        serviceBaseName,
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
          true
        );

        const getFunctionSampleArg = getSampleArg(
          (controller as any)[serviceMetadata.serviceName].Types,
          serviceBaseName,
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
          serviceBaseName,
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
        name: 'http://localhost:3000/metdata',
        request: {
          method: 'POST',
          url: {
            raw: 'http://localhost:3000/metadata',
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['metadata']
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

export default function initializeController<T>(controller: T) {
  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object' && value.constructor !== Object)
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      Object.entries((controller as any)[serviceName].Types).forEach(([, typeClass]: [string, any]) => {
        setPropertyTypeValidationDecorators(typeClass, serviceName, (controller as any)[serviceName].Types);
        setNestedTypeAndValidationDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
      }, {});
    });

  writePostmanCollectionExportFile(controller);
}
