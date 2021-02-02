import { parseSync } from '@babel/core';
import { getFromContainer, MetadataStorage, ValidationTypes, Validator } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import { readFileSync } from 'fs';
import getSrcFilePathNameForTypeName, {
  hasBackkSrcFilenameForTypeName,
  hasSrcFilenameForTypeName
} from '../utils/file/getSrcFilePathNameForTypeName';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import parseEnumValuesFromSrcFile from '../typescript/parser/parseEnumValuesFromSrcFile';
import typePropertyAnnotationContainer from '../decorators/typeproperty/typePropertyAnnotationContainer';
import entityAnnotationContainer from '../decorators/entity/entityAnnotationContainer';

export function getPropertyValidationOfType(typeClass: Function, propertyName: string, validationType: string) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  return validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === validationType
  );
}

function doesPropertyContainValidation(typeClass: Function, propertyName: string, validationType: string) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  const foundValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === validationType
  );

  return foundValidation !== undefined;
}

export function doesClassPropertyContainCustomValidation(
  Class: Function,
  propertyName: string,
  validationType: string,
  disregardFirstGroup?: string,
  group?: string
) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(Class, '');

  const foundValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName &&
      validationMetadata.type === 'customValidation' &&
      validationMetadata.constraints[0] === validationType &&
      (!disregardFirstGroup ||
        (disregardFirstGroup && validationMetadata.groups[0] !== disregardFirstGroup)) &&
      (!group || (group && validationMetadata.groups.includes(group)))
  );

  return foundValidation !== undefined;
}

// noinspection FunctionWithMultipleLoopsJS,OverlyComplexFunctionJS,FunctionTooLongJS,FunctionWithMoreThanThreeNegationsJS
export default function setClassPropertyValidationDecorators(
  Class: Function,
  serviceName: string,
  Types: { [key: string]: new () => any },
  remoteServiceRootDir = ''
) {
  const className = Class.name;

  if (hasBackkSrcFilenameForTypeName(className)) {
    return;
  }

  const fileContentsStr = readFileSync(getSrcFilePathNameForTypeName(className, remoteServiceRootDir), {
    encoding: 'UTF-8'
  });

  const fileRows = fileContentsStr.split('\n');

  const ast = parseSync(fileContentsStr, {
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-transform-typescript'
    ]
  });

  const nodes = (ast as any).program.body;

  for (const node of nodes) {
    if (
      (node.type === 'ExportDefaultDeclaration' || node.type === 'ExportNamedDeclaration') &&
      node.declaration.type === 'ClassDeclaration' &&
      node.declaration.id.name === className
    ) {
      for (const classBodyNode of node.declaration.body.body) {
        if (classBodyNode.type === 'ClassProperty') {
          const propertyName = classBodyNode.key.name;
          let baseTypeName: string;
          let propertyTypeName;
          let isNullableType = false;
          let isArrayType = false;

          const isPrivateProperty = classBodyNode.accessibility !== 'public';
          if (isPrivateProperty && entityAnnotationContainer.isEntity(Class)) {
            typePropertyAnnotationContainer.setTypePropertyAsPrivate(Class, propertyName);

            const validationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CUSTOM_VALIDATION,
              target: Class,
              propertyName,
              constraints: ['isUndefined'],
              validationOptions: { each: isArrayType }
            };

            const validationMetadata = new ValidationMetadata(validationMetadataArgs);
            validationMetadata.groups = ['__backk_update__'];
            getFromContainer(MetadataStorage).addValidationMetadata(validationMetadata);
          }

          if (classBodyNode.readonly && entityAnnotationContainer.isEntity(Class)) {
            const validationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CUSTOM_VALIDATION,
              target: Class,
              propertyName,
              constraints: ['isUndefined'],
              validationOptions: { each: isArrayType }
            };

            const validationMetadata = new ValidationMetadata(validationMetadataArgs);

            if (propertyName === '_id') {
              validationMetadata.groups = ['__backk_create__'];
            } else {
              validationMetadata.groups = ['__backk_create__', '__backk_update__'];
            }

            getFromContainer(MetadataStorage).addValidationMetadata(validationMetadata);
          }

          if (classBodyNode.typeAnnotation === undefined) {
            if (typeof classBodyNode.value?.value === 'number') {
              propertyTypeName = 'number';
              baseTypeName = 'number';
            } else if (typeof classBodyNode.value?.value === 'boolean') {
              propertyTypeName = 'boolean';
              baseTypeName = 'boolean';
            } else if (typeof classBodyNode.value?.value === 'string') {
              propertyTypeName = 'string';
              baseTypeName = 'string';
            } else if (
              typeof classBodyNode.value?.value === 'object' ||
              typeof classBodyNode.value?.value === 'bigint' ||
              typeof classBodyNode.value?.value === 'symbol'
            ) {
              throw new Error(
                'Default value must a scalar (number, boolean or string) for property: ' +
                  propertyName +
                  ' in ' +
                  Class.name
              );
            } else {
              throw new Error('Missing type annotation for property: ' + propertyName + ' in ' + Class.name);
            }
          } else {
            const propertyTypeNameStart = classBodyNode.typeAnnotation.loc.start;
            const propertyTypeNameEnd = classBodyNode.typeAnnotation.loc.end;

            propertyTypeName = fileRows[propertyTypeNameStart.line - 1].slice(
              propertyTypeNameStart.column + 2,
              propertyTypeNameEnd.column
            );

            ({ baseTypeName, isArrayType, isNullableType } = getTypeInfoForTypeName(propertyTypeName));
          }
          let validationType;
          let constraints;

          if (
            propertyName === '_id' ||
            propertyName === 'id' ||
            propertyName.endsWith('Id') ||
            propertyName.endsWith('Ids')
          ) {
            if (!doesClassPropertyContainCustomValidation(Class, propertyName, 'maxLengthAndMatches')) {
              const validationMetadataArgs: ValidationMetadataArgs = {
                type: ValidationTypes.CUSTOM_VALIDATION,
                target: Class,
                propertyName,
                constraints: ['maxLengthAndMatches', 24, /^[a-f\d]{1,24}$/],
                validationOptions: { each: isArrayType }
              };

              getFromContainer(MetadataStorage).addValidationMetadata(
                new ValidationMetadata(validationMetadataArgs)
              );
            }
          }

          // noinspection IfStatementWithTooManyBranchesJS
          if (baseTypeName === 'boolean') {
            const validationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CUSTOM_VALIDATION,
              target: Class,
              propertyName,
              constraints: ['isBooleanOrTinyInt'],
              validationOptions: { each: isArrayType }
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(validationMetadataArgs)
            );
          } else if (baseTypeName === 'number') {
            if (
              !doesPropertyContainValidation(Class, propertyName, ValidationTypes.IS_INT) &&
              !doesClassPropertyContainCustomValidation(Class, propertyName, 'isBigInt')
            ) {
              validationType = ValidationTypes.IS_NUMBER;
              constraints = [{}];
            }
          } else if (baseTypeName === 'string') {
            if (
              propertyName === '_id' ||
              propertyName === 'id' ||
              propertyName.endsWith('Id') ||
              propertyName.endsWith('Ids')
            ) {
              if (!doesClassPropertyContainCustomValidation(Class, propertyName, 'isStringOrObjectId')) {
                const validationMetadataArgs: ValidationMetadataArgs = {
                  type: ValidationTypes.CUSTOM_VALIDATION,
                  target: Class,
                  propertyName,
                  constraints: ['isStringOrObjectId'],
                  validationOptions: { each: isArrayType }
                };

                getFromContainer(MetadataStorage).addValidationMetadata(
                  new ValidationMetadata(validationMetadataArgs)
                );
              }
            } else {
              validationType = ValidationTypes.IS_STRING;
            }
          } else if (baseTypeName === 'Date') {
            validationType = ValidationTypes.IS_DATE;
          } else if (baseTypeName.charAt(0).match(/^[_$A-Z]$/)) {
            validationType = ValidationTypes.IS_INSTANCE;
            if (Types[baseTypeName]) {
              constraints = [Types[baseTypeName]];
            } else if (hasSrcFilenameForTypeName(baseTypeName)) {
              const enumValues = parseEnumValuesFromSrcFile(baseTypeName);
              validationType = ValidationTypes.IS_IN;
              constraints = [enumValues];
            } else {
              throw new Error(
                'Type: ' +
                  baseTypeName +
                  ' not found in ' +
                  serviceName.charAt(0).toUpperCase() +
                  serviceName.slice(1) +
                  '.Types'
              );
            }
          } else if (baseTypeName !== 'any') {
            validationType = ValidationTypes.IS_IN;

            if (baseTypeName[0] === '(' && baseTypeName[baseTypeName.length - 1] === ')') {
              baseTypeName = baseTypeName.slice(1, -1);
            }

            let enumType: any;
            const enumValues = baseTypeName.split('|').map((enumValue) => {
              const trimmedEnumValue = enumValue.trim();
              const validator = new Validator();

              if (validator.isNumberString(trimmedEnumValue)) {
                if (enumType === 'string') {
                  throw new Error(
                    'All enum values must be of same type: ' +
                      baseTypeName +
                      ' in ' +
                      className +
                      '.' +
                      propertyName
                  );
                }
                enumType = 'number';
                return parseFloat(trimmedEnumValue);
              } else if (
                (trimmedEnumValue.charAt(0) === "'" &&
                  trimmedEnumValue.charAt(trimmedEnumValue.length - 1) === "'") ||
                (trimmedEnumValue.charAt(0) === '"' &&
                  trimmedEnumValue.charAt(trimmedEnumValue.length - 1) === '"')
              ) {
                if (enumType === 'number') {
                  throw new Error(
                    'All enum values must be of same type: ' +
                      baseTypeName +
                      ' in ' +
                      className +
                      '.' +
                      propertyName
                  );
                }
                enumType = 'string';
                return trimmedEnumValue.slice(1, -1);
              } else {
                throw new Error(
                  'Enum values cannot contain | character in ' + className + '.' + propertyName
                );
              }
            });

            constraints = [enumValues];
          }

          if (validationType && !doesPropertyContainValidation(Class, propertyName, validationType)) {
            const validationMetadataArgs: ValidationMetadataArgs = {
              type: validationType,
              target: Class,
              propertyName,
              constraints,
              validationOptions: { each: isArrayType }
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(validationMetadataArgs)
            );
          }

          if (isArrayType && !doesPropertyContainValidation(Class, propertyName, ValidationTypes.IS_ARRAY)) {
            const arrayValidationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.IS_ARRAY,
              target: Class,
              propertyName
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(arrayValidationMetadataArgs)
            );
          }

          if (isNullableType) {
            const isNullableValidationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CONDITIONAL_VALIDATION,
              target: Class,
              propertyName,
              constraints: [(object: any) => object[propertyName] !== null, 'isNullable'],
              validationOptions: { each: isArrayType }
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(isNullableValidationMetadataArgs)
            );
          }

          const conditionalValidation = getPropertyValidationOfType(
            Class,
            propertyTypeName,
            ValidationTypes.CONDITIONAL_VALIDATION
          );

          if (
            classBodyNode.optional &&
            (!conditionalValidation || conditionalValidation.constraints[1] !== 'isOptional')
          ) {
            const optionalValidationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CONDITIONAL_VALIDATION,
              target: Class,
              constraints: [
                (object: any) => {
                  return object[propertyName] !== null && object[propertyName] !== undefined;
                },
                'isOptional'
              ],
              propertyName
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(optionalValidationMetadataArgs)
            );
          }

          if (propertyName !== '_id' && entityAnnotationContainer.isEntity(Class)) {
            const optionalValidationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CONDITIONAL_VALIDATION,
              target: Class,
              constraints: [
                (object: any) => {
                  return object[propertyName] !== null && object[propertyName] !== undefined;
                },
                'isOptional'
              ],
              propertyName
            };

            const validationMetadata = new ValidationMetadata(optionalValidationMetadataArgs);
            validationMetadata.groups = ['__backk_update__'];
            getFromContainer(MetadataStorage).addValidationMetadata(validationMetadata);
          }
        }
      }
    }
  }
}
