import { parseSync } from '@babel/core';
import { getFromContainer, MetadataStorage, ValidationTypes, Validator } from 'class-validator';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import { readFileSync } from 'fs';
import getSrcFilePathNameForTypeName from '../utils/file/getSrcFilePathNameForTypeName';
import SortBy from "../types/SortBy";

function doesPropertyContainValidation(typeClass: Function, propertyName: string, validationType: string) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  const foundValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === validationType
  );

  return foundValidation !== undefined;
}

function doesPropertyContainCustomValidation(
  typeClass: Function,
  propertyName: string,
  validationType: string
) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  const foundValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName &&
      validationMetadata.type === 'customValidation' &&
      validationMetadata.constraints[0] === validationType
  );

  return foundValidation !== undefined;
}

// noinspection FunctionWithMultipleLoopsJS,OverlyComplexFunctionJS,FunctionTooLongJS,FunctionWithMoreThanThreeNegationsJS
export default function setPropertyTypeValidationDecorators(
  typeClass: Function,
  serviceName: string,
  Types: { [key: string]: new () => any }
) {
  const typeClassName = typeClass.name;

  if (
    typeClassName === '_Id' ||
    typeClassName === 'Id' ||
    typeClassName === 'OptPostQueryOps' ||
    typeClassName === 'IdsAndOptPostQueryOps' ||
    typeClassName === 'SortBy' ||
    typeClassName === 'IdAndUserId'
  ) {
    return;
  }

  const fileContentsStr = readFileSync(getSrcFilePathNameForTypeName(typeClassName), { encoding: 'UTF-8' });
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
      node.declaration.id.name === typeClassName
    ) {
      for (const classBodyNode of node.declaration.body.body) {
        if (classBodyNode.type === 'ClassProperty') {
          const propertyName = classBodyNode.key.name;
          if (classBodyNode.typeAnnotation === undefined) {
            throw new Error(
              'Missing type annotation for property: ' + propertyName + ' in ' + typeClass.name
            );
          }
          const propertyTypeNameStart = classBodyNode.typeAnnotation.loc.start;
          const propertyTypeNameEnd = classBodyNode.typeAnnotation.loc.end;

          const propertyTypeName = fileRows[propertyTypeNameStart.line - 1].slice(
            propertyTypeNameStart.column + 2,
            propertyTypeNameEnd.column
          );

          let finalPropertyTypeName = propertyTypeName.split('[]')[0];
          let validationType;
          let constraints;

          if (propertyName === '_id' || propertyName === 'id' || propertyName.endsWith('Id') || propertyName.endsWith('Ids')) {
            if (
              !doesPropertyContainValidation(typeClass, propertyName, ValidationTypes.MAX_LENGTH)) {
              const validationMetadataArgs: ValidationMetadataArgs = {
                type: ValidationTypes.MAX_LENGTH,
                target: typeClass,
                propertyName,
                constraints: [24],
                validationOptions: { each: propertyTypeName.endsWith('[]') }
              };

              getFromContainer(MetadataStorage).addValidationMetadata(
                new ValidationMetadata(validationMetadataArgs)
              );
            }

            if (
              !doesPropertyContainValidation(typeClass, propertyName, ValidationTypes.MATCHES)) {
              const validationMetadataArgs: ValidationMetadataArgs = {
                type: ValidationTypes.MATCHES,
                target: typeClass,
                propertyName,
                constraints: [/^[a-f\d]{1,24}$/],
                validationOptions: { each: propertyTypeName.endsWith('[]') }
              };

              getFromContainer(MetadataStorage).addValidationMetadata(
                new ValidationMetadata(validationMetadataArgs)
              );
            }
          }

          // noinspection IfStatementWithTooManyBranchesJS
          if (finalPropertyTypeName === 'boolean') {
            validationType = ValidationTypes.IS_BOOLEAN;
          } else if (finalPropertyTypeName === 'number') {
            if (
              !doesPropertyContainValidation(typeClass, propertyName, ValidationTypes.IS_INT) &&
              !doesPropertyContainCustomValidation(typeClass, propertyName, 'isBigInt')
            ) {
              validationType = ValidationTypes.IS_NUMBER;
              constraints = [{}];
            }
          } else if (finalPropertyTypeName === 'string') {
            validationType = ValidationTypes.IS_STRING;
          } else if (finalPropertyTypeName.charAt(0).match(/^[_$A-Z]$/)) {
            validationType = ValidationTypes.IS_INSTANCE;
            if (Types[finalPropertyTypeName]) {
              constraints = [Types[finalPropertyTypeName]];
            } else if (finalPropertyTypeName === 'SortBy') {
              constraints = [SortBy];
            } else {
              throw new Error(
                'Type: ' +
                  finalPropertyTypeName +
                  ' not found in ' +
                  serviceName.charAt(0).toUpperCase() +
                  serviceName.slice(1) +
                  '.Types'
              );
            }
          } else if (finalPropertyTypeName !== 'any') {
            validationType = ValidationTypes.IS_IN;

            if (
              finalPropertyTypeName[0] === '(' &&
              finalPropertyTypeName[finalPropertyTypeName.length - 1] === ')'
            ) {
              finalPropertyTypeName = finalPropertyTypeName.slice(1, -1);
            }

            let enumType: any;
            const enumValues = finalPropertyTypeName.split('|').map((enumValue) => {
              const trimmedEnumValue = enumValue.trim();
              const validator = new Validator();

              if (validator.isNumberString(trimmedEnumValue)) {
                if (enumType === 'string') {
                  throw new Error(
                    'All enum values must be of same type: ' +
                      finalPropertyTypeName +
                      ' in ' +
                      typeClassName +
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
                      finalPropertyTypeName +
                      ' in ' +
                      typeClassName +
                      '.' +
                      propertyName
                  );
                }
                enumType = 'string';
                return trimmedEnumValue.slice(1, -1);
              } else {
                throw new Error(
                  'Enum values cannot contain | character in ' + typeClassName + '.' + propertyName
                );
              }
            });

            constraints = [enumValues];
          }

          if (validationType && !doesPropertyContainValidation(typeClass, propertyName, validationType)) {
            const validationMetadataArgs: ValidationMetadataArgs = {
              type: validationType,
              target: typeClass,
              propertyName,
              constraints,
              validationOptions: { each: propertyTypeName.endsWith('[]') }
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(validationMetadataArgs)
            );
          }

          if (
            propertyTypeName.endsWith('[]') &&
            !doesPropertyContainValidation(typeClass, propertyName, ValidationTypes.IS_ARRAY)
          ) {
            const optionalValidationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.IS_ARRAY,
              target: typeClass,
              propertyName
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(optionalValidationMetadataArgs)
            );
          }

          if (
            classBodyNode.optional &&
            !doesPropertyContainValidation(typeClass, propertyName, ValidationTypes.CONDITIONAL_VALIDATION)
          ) {
            const optionalValidationMetadataArgs: ValidationMetadataArgs = {
              type: ValidationTypes.CONDITIONAL_VALIDATION,
              target: typeClass,
              constraints: [
                (object: any) => {
                  return object[propertyName] !== null && object[propertyName] !== undefined;
                }
              ],
              propertyName
            };

            getFromContainer(MetadataStorage).addValidationMetadata(
              new ValidationMetadata(optionalValidationMetadataArgs)
            );
          }
        }
      }
    }
  }
}
