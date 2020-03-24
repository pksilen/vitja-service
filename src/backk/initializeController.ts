import { getFromContainer, MetadataStorage, ValidationTypes } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import generateServicesMetadata, { FunctionMetadata, ServiceMetadata } from './generateServicesMetadata';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

function setDecorators(
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

function getSampleArg(typeProperties: object, types: { [key: string]: object }): object {
  const sampleArg: { [key: string]: any } = {};

  Object.entries(typeProperties).map(([propertyName, propertyTypeName]: [string, string]) => {
    let finalPropertyTypeName = propertyTypeName.startsWith('?')
      ? propertyTypeName.slice(1)
      : propertyTypeName;

    const propertyTypeNameAndDefaultValue = finalPropertyTypeName.split(' = ');
    finalPropertyTypeName = propertyTypeNameAndDefaultValue[0];
    const defaultValue = propertyTypeNameAndDefaultValue[1];

    if (finalPropertyTypeName.startsWith('integer') || finalPropertyTypeName.startsWith('number')) {
      sampleArg[propertyName] = defaultValue ?? 123;
    } else if (finalPropertyTypeName.startsWith('boolean')) {
      sampleArg[propertyName] = defaultValue ?? true;
    } else if (finalPropertyTypeName.startsWith('string')) {
      sampleArg[propertyName] = defaultValue ?? 'abc';
    } else if (finalPropertyTypeName.startsWith('(')) {
      sampleArg[propertyName] = defaultValue ?? finalPropertyTypeName.slice(1).split(/[|)]/)[0].split("'")[1];
    } else if (types[finalPropertyTypeName]) {
      sampleArg[propertyName] = getSampleArg(types[finalPropertyTypeName], types);
    }

    if (finalPropertyTypeName.endsWith('[]')) {
      sampleArg[propertyName] = defaultValue !== undefined ? JSON.parse(defaultValue) : [sampleArg[propertyName]];
    }
  });

  return sampleArg;
}

function writePostmanCollectionExportFile<T>(controller: T) {
  const servicesMetadata = generateServicesMetadata(controller);
  const items: any[] = [];

  servicesMetadata.forEach((serviceMetadata: ServiceMetadata) =>
    serviceMetadata.functions.forEach((functionMetadata: FunctionMetadata) => {
      const sampleArg = getSampleArg(serviceMetadata.types[functionMetadata.argType], serviceMetadata.types);
      items.push({
        name: 'http://localhost:3000/' + serviceMetadata.serviceName + '.' + functionMetadata.functionName,
        request: {
          method: 'POST',
          header: [
            {
              key: 'Content-Type',
              name: 'Content-Type',
              value: 'application/json',
              type: 'text'
            }
          ],
          body: {
            mode: 'raw',
            raw: JSON.stringify(sampleArg, null, 4),
            options: {
              raw: {
                language: 'json'
              }
            }
          },
          url: {
            raw: 'http://localhost:3000/salesItemsService.getSalesItems',
            protocol: 'http',
            host: ['localhost'],
            port: '3000',
            path: ['salesItemsService.getSalesItems']
          }
        },
        response: []
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

  writeFileSync(process.cwd() + '/postman/postman_collection.json', JSON.stringify(postmanMetadata));
}

export default function initializeController<T>(controller: T) {
  writePostmanCollectionExportFile(controller);

  Object.entries(controller)
    .filter(([, value]: [string, any]) => typeof value === 'object' && value.constructor !== Object)
    .forEach(([serviceName]: [string, any]) => {
      const targetAndPropNameToHasNestedValidationMap: { [key: string]: boolean } = {};
      Object.entries((controller as any)[serviceName].Types).forEach(([, typeClass]: [string, any]) => {
        setDecorators(typeClass, targetAndPropNameToHasNestedValidationMap);
      }, {});
    });
}
