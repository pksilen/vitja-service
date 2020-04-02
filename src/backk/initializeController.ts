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
  serviceBaseName: string,
  argTypeName: string,
  serviceMetadata: ServiceMetadata
): object | undefined {
  const sampleArg: { [key: string]: any } = {};
  const typeProperties = serviceMetadata.types[argTypeName];
  const types = serviceMetadata.types;

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

    const testValue = testValueContainer.getTestValue(argTypeName, propertyName);

    if (testValue !== undefined) {
      sampleArg[propertyName] = testValue;
    } else if (propertyName === '_id') {
      sampleArg[propertyName] = `{{${serviceBaseName}Id}}`;
    } else if (propertyName === '_ids') {
      sampleArg[propertyName] = `[{{${serviceBaseName}Id}}]`;
    } else if (propertyName.endsWith('Id')) {
      sampleArg[propertyName] = `{{${propertyName}}}`;
    } else if (finalPropertyTypeName.startsWith('integer')) {
      sampleArg[propertyName] = defaultValue ?? 123;
    } else if (finalPropertyTypeName.startsWith('number')) {
      sampleArg[propertyName] = defaultValue ?? 123.12;
    } else if (finalPropertyTypeName.startsWith('boolean')) {
      sampleArg[propertyName] = defaultValue ?? true;
    } else if (finalPropertyTypeName.startsWith('string')) {
      sampleArg[propertyName] = defaultValue ?? 'abc';
    } else if (finalPropertyTypeName.startsWith('(')) {
      sampleArg[propertyName] =
        defaultValue ??
        finalPropertyTypeName
          .slice(1)
          .split(/[|)]/)[0]
          .split("'")[1];
    } else if (types[finalPropertyTypeNameWithoutArraySuffix]) {
      sampleArg[propertyName] = getSampleArg(
        serviceBaseName,
        finalPropertyTypeNameWithoutArraySuffix,
        serviceMetadata
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
  returnValueTypeName: string,
  serviceMetadata: ServiceMetadata,
  responsePath: string,
  isOptional: boolean
): string[] {
  const returnValueMetadata = serviceMetadata.types[returnValueTypeName];
  const types = serviceMetadata.types;
  const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
  const serviceEntityName =
    serviceBaseName.charAt(serviceBaseName.length - 1) === 's'
      ? serviceBaseName.slice(0, -1)
      : serviceBaseName;
  const javascriptLines = ['const response = pm.response.json();'];

  Object.entries(returnValueMetadata).map(([propertyName, propertyTypeName]) => {
    const isOptionalProperty = propertyTypeName.startsWith('?') || isOptional;
    const isArray = propertyTypeName.endsWith('[]');
    let finalPropertyTypeName = propertyTypeName;

    if (isArray) {
      finalPropertyTypeName = propertyTypeName.slice(0, -2);
    }

    let expectedValue: any;

    if (propertyName === '_id') {
      expectedValue = `pm.collectionVariables.get('${serviceEntityName}Id')`;
    } else {
      switch (finalPropertyTypeName) {
        case 'string':
          expectedValue = "'abc'";
          break;
        case 'boolean':
          expectedValue = true;
          break;
        case 'integer':
          expectedValue = 123;
          break;
        case 'number':
          expectedValue = 123.12;
          break;
      }
    }

    if (finalPropertyTypeName.startsWith('(')) {
      expectedValue = finalPropertyTypeName.slice(1).split(/[|)]/)[0];
    } else if (types[finalPropertyTypeName]) {
      const finalResponsePath = responsePath + (isArray ? '[0]' : '') + '.' + finalPropertyTypeName + '.';
      if (!isOptionalProperty) {
        javascriptLines.concat(
          getReturnValueTests(finalPropertyTypeName, serviceMetadata, finalResponsePath, isOptional)
        );
      }
    }

    if (isOptionalProperty) {
      if (isArray) {
        javascriptLines.push(
          `pm.test("${propertyName}", function () {
            if (response${responsePath}${propertyName} !== undefined) 
              return pm.expect(response${responsePath}${propertyName}).to.have.members([${expectedValue}]);
            else 
              return true; 
          })`
        );
      } else {
        javascriptLines.push(
          `pm.test("${propertyName}", function () {
            if (response${responsePath}${propertyName} !== undefined) 
             return pm.expect(response${responsePath}${propertyName}).to.eql(${expectedValue});
            else 
              return true; 
          })`
        );
      }
    } else {
      if (isArray) {
        javascriptLines.push(
          `pm.test("${propertyName}", function () {
            pm.expect(response${responsePath}${propertyName}).to.have.members([${expectedValue}]); 
          })`
        );
      } else {
        javascriptLines.push(
          `pm.test("${propertyName}", function () {
            pm.expect(response${responsePath}${propertyName}).to.eql(${expectedValue}); 
          })`
        );
      }
    }
  });

  return javascriptLines;
}

function getTests(serviceMetadata: ServiceMetadata, functionMetadata: FunctionMetadata): object | undefined {
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

  const checkResponseCodeIsOk = `pm.test("Status code is 200 OK", function () {
      pm.response.to.have.status(200);
    });`;

  if (returnValueTypeName === 'IdWrapper') {
    return {
      id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
      listen: 'test',
      script: {
        id: serviceMetadata.serviceName + '.' + functionMetadata.functionName,
        exec: [
          checkResponseCodeIsOk,
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
        returnValueTypeName === 'void'
          ? [checkResponseCodeIsOk]
          : [
              checkResponseCodeIsOk,
              ...getReturnValueTests(returnValueTypeName, serviceMetadata, isArray ? '[0].' : '.', isOptional)
            ]
    }
  };
}

function writePostmanCollectionExportFile<T>(controller: T) {
  const servicesMetadata = generateServicesMetadata(controller);
  const items: any[] = [];

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) =>
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata) => {
      const tests = getTests(serviceMetadata, functionMetadata);
      const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
      const sampleArg = getSampleArg(serviceBaseName, functionMetadata.argType, serviceMetadata);
      items.push({
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
      });
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
