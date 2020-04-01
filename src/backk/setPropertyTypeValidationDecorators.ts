import { readFileSync } from 'fs';
import { parseSync } from '@babel/core';
import getSrcFilenameForTypeName from './getSrcFilenameForTypeName';
import { getFromContainer, MetadataStorage, ValidationTypes, Validator } from 'class-validator';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

function doesPropertyContainValidation(typeClass: Function, propertyName: string, validationType: string) {
  const validationMetadatas = getFromContainer(MetadataStorage).getTargetValidationMetadatas(typeClass, '');

  const foundValidation = validationMetadatas.find(
    (validationMetadata: ValidationMetadata) =>
      validationMetadata.propertyName === propertyName && validationMetadata.type === validationType
  );

  return foundValidation !== undefined;
}

// noinspection FunctionWithMultipleLoopsJS,OverlyComplexFunctionJS,FunctionTooLongJS,FunctionWithMoreThanThreeNegationsJS
export default function setPropertyTypeValidationDecorators(
  typeClass: Function,
  serviceName: string,
  types: { [key: string]: object }
) {
  const typeClassName = typeClass.name;

  if (typeClassName === 'IdWrapper' || typeClassName === 'IdsWrapper') {
    return;
  }

  const fileContentsStr = readFileSync(getSrcFilenameForTypeName(typeClassName), { encoding: 'UTF-8' });
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
          const propertyTypeNameStart = classBodyNode.typeAnnotation.loc.start;
          const propertyTypeNameEnd = classBodyNode.typeAnnotation.loc.end;

          const propertyTypeName = fileRows[propertyTypeNameStart.line - 1].slice(
            propertyTypeNameStart.column + 2,
            propertyTypeNameEnd.column
          );

          let finalPropertyTypeName = propertyTypeName.split('[]')[0];
          let validationType;
          let constraints;

          // noinspection IfStatementWithTooManyBranchesJS
          if (finalPropertyTypeName === 'boolean') {
            validationType = ValidationTypes.IS_BOOLEAN;
          } else if (finalPropertyTypeName === 'number') {
            if (!doesPropertyContainValidation(typeClass, propertyName, ValidationTypes.IS_INT)) {
              validationType = ValidationTypes.IS_NUMBER;
              constraints = [{}];
            }
          } else if (finalPropertyTypeName === 'string') {
            validationType = ValidationTypes.IS_STRING;
          } else if (finalPropertyTypeName.charAt(0).match(/^[_$A-Z]$/)) {
            if (types[finalPropertyTypeName]) {
              validationType = ValidationTypes.IS_INSTANCE;
              constraints = [types[finalPropertyTypeName]];
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
            const enumValues = finalPropertyTypeName.split('|').map((enumValue) => {
              const trimmedEnumValue = enumValue.trim();
              const validator = new Validator();

              if (validator.isNumberString(trimmedEnumValue)) {
                return parseFloat(trimmedEnumValue);
              } else if (
                (trimmedEnumValue.charAt(0) === "'" &&
                  trimmedEnumValue.charAt(trimmedEnumValue.length - 1) === "'") ||
                (trimmedEnumValue.charAt(0) === '"' &&
                  trimmedEnumValue.charAt(trimmedEnumValue.length - 1) === '"')
              ) {
                return trimmedEnumValue.slice(1, -1);
              } else {
                throw new Error(
                  'Incompatible type: ' + finalPropertyTypeName + ' in ' + typeClassName + '.' + propertyName
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
