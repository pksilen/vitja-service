import { readFileSync } from 'fs';
import { parseSync } from '@babel/core';
import getSrcFilenameForTypeName from './getSrcFilenameForTypeName';
import { getFromContainer, MetadataStorage, ValidationTypes, Validator } from 'class-validator';
import { ValidationMetadataArgs } from 'class-validator/metadata/ValidationMetadataArgs';
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata';

function doesPropertyContainValidation(
  typeClass: Function,
  propertyName: string,
  validationType: string
) {
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
      node.type === 'ExportDefaultDeclaration' &&
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
            validationType = ValidationTypes.IS_NUMBER;
            constraints = [{}];
          } else if (finalPropertyTypeName === 'string') {
            validationType = ValidationTypes.IS_STRING;
          } else if (types[finalPropertyTypeName]) {
            validationType = ValidationTypes.IS_INSTANCE;
            constraints = [types[finalPropertyTypeName]];
          } else if (finalPropertyTypeName !== 'any') {
            validationType = ValidationTypes.IS_IN;
            if (
              finalPropertyTypeName[0] === '(' &&
              finalPropertyTypeName[finalPropertyTypeName.length - 1] === ')'
            ) {
              finalPropertyTypeName = finalPropertyTypeName.slice(1, -1);
            }
            const enumValues = finalPropertyTypeName.split('|').map((enumValue) => {
              // noinspection AssignmentToFunctionParameterJS
              enumValue = enumValue.trim();
              if (
                (enumValue.charAt(0) === "'" && enumValue.charAt(enumValue.length - 1) === "'") ||
                (enumValue.charAt(0) === '"' && enumValue.charAt(enumValue.length - 1) === '"')
              ) {
                // noinspection AssignmentToFunctionParameterJS
                enumValue = enumValue.slice(1, -1);
              }
              const validator = new Validator();
              if (validator.isNumberString(enumValue)) {
                return parseFloat(enumValue);
              }
              return enumValue;
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
              constraints: [(object: any) => {
                return object[propertyName] !== null && object[propertyName] !== undefined;
              }],
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
