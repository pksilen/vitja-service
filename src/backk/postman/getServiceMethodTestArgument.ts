import testValueContainer from '../decorators/typeproperty/testing/testValueContainer';
import getValidationConstraint from '../validation/getValidationConstraint';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import isEnumTypeName from '../utils/type/isEnumTypeName';
import parseEnumValuesFromSrcFile from '../typescript/parser/parseEnumValuesFromSrcFile';
import typePropertyAnnotationContainer from '../decorators/typeproperty/typePropertyAnnotationContainer';
import { doesClassPropertyContainCustomValidation } from '../validation/setClassPropertyValidationDecorators';
import getCustomValidationConstraint from '../validation/getCustomValidationConstraint';

export default function getServiceMethodTestArgument(
  serviceTypes: { [key: string]: Function },
  functionName: string,
  argTypeName: string,
  serviceMetadata: ServiceMetadata,
  isInitialUpdate: boolean = false,
  previousUpdateSampleArg?: { [key: string]: any },
  isRecursive = false,
  isManyToMany = false
): object | undefined {
  const sampleArg: { [key: string]: any } = {};
  const argTypeProperties = serviceMetadata.types[argTypeName];
  const types = serviceMetadata.types;

  const serviceBaseName = serviceMetadata.serviceName.split('Service')[0];
  const serviceEntityName =
    serviceBaseName.charAt(serviceBaseName.length - 1) === 's'
      ? serviceBaseName.slice(0, -1)
      : serviceBaseName;

  if (argTypeProperties === undefined) {
    return undefined;
  }

  Object.entries(argTypeProperties).forEach(([propertyName, propertyTypeName]: [string, string]) => {
    if (
      doesClassPropertyContainCustomValidation(
        serviceTypes[argTypeName],
        propertyName,
        'isUndefined',
        undefined,
        '__backk_create__'
      ) &&
      (functionName.startsWith('create') ||
        functionName.startsWith('add') ||
        functionName.startsWith('insert')) &&
      (propertyName !== '_id' || (propertyName === '_id' && !isRecursive))
    ) {
      return;
    }

    if (
      doesClassPropertyContainCustomValidation(
        serviceTypes[argTypeName],
        propertyName,
        'isUndefined',
        undefined,
        '__backk_update__'
      ) &&
      (functionName.startsWith('update') ||
        functionName.startsWith('change') ||
        functionName.startsWith('modify')) &&
      (propertyName !== '_id' || (propertyName === '_id' && !isRecursive))
    ) {
      return;
    }

    let isUpdate = isInitialUpdate;
    if (
      previousUpdateSampleArg !== undefined &&
      (previousUpdateSampleArg as any)[propertyName] === undefined
    ) {
      isUpdate = false;
    }

    const {
      baseTypeName,
      defaultValueStr,
      isArrayType,
      isNullableType,
      isOptionalType
    } = getTypeInfoForTypeName(propertyTypeName);

    if (isOptionalType && defaultValueStr === undefined && !isUpdate) {
      return;
    }

    if (isManyToMany) {
      isUpdate = false;
    }

    const testValue = testValueContainer.getTestValue(serviceTypes[argTypeName], propertyName);
    const minValue =
      getValidationConstraint(serviceTypes[argTypeName], propertyName, 'min') ??
      getCustomValidationConstraint(serviceTypes[argTypeName], propertyName, 'minMax', 1);

    const maxValue =
      getValidationConstraint(serviceTypes[argTypeName], propertyName, 'max') ??
      getCustomValidationConstraint(serviceTypes[argTypeName], propertyName, 'minMax', 2);

    if (testValue !== undefined) {
      sampleArg[propertyName] = testValue;
    } else if (propertyName === '_id') {
      if (isRecursive) {
        sampleArg[propertyName] = `{{${argTypeName.charAt(0).toLowerCase() + argTypeName.slice(1)}Id}}`;
      } else {
        sampleArg[propertyName] = `{{${serviceEntityName}Id}}`;
      }
    } else if (propertyName === '_ids') {
      sampleArg[propertyName] = `{{${serviceEntityName}Id}}`;
    } else if (propertyName.endsWith('Id')) {
      sampleArg[propertyName] = `{{${propertyName}}}`;
    } else if (propertyName === 'id') {
      sampleArg[propertyName] = '0';
    } else if (isNullableType && !isUpdate && !types[baseTypeName]) {
      sampleArg[propertyName] = null;
    } else if (baseTypeName.startsWith('integer') || baseTypeName.startsWith('bigint')) {
      sampleArg[propertyName] = isUpdate ? maxValue : minValue;
    } else if (baseTypeName.startsWith('number')) {
      sampleArg[propertyName] = isUpdate ? parseFloat(maxValue.toFixed(2)) : parseFloat(minValue.toFixed(2));
    } else if (baseTypeName.startsWith('boolean')) {
      sampleArg[propertyName] = !isUpdate;
    } else if (baseTypeName.startsWith('string')) {
      sampleArg[propertyName] = isUpdate ? 'abcd' : 'abc';
    } else if (baseTypeName.startsWith('Date')) {
      sampleArg[propertyName] = isUpdate ? new Date(120000).toISOString() : new Date(60000).toISOString();
    } else if (isEnumTypeName(baseTypeName)) {
      let enumValues;
      if (baseTypeName.startsWith('(')) {
        enumValues = baseTypeName.slice(1).split(/[|)]/);
      } else {
        enumValues = parseEnumValuesFromSrcFile(baseTypeName);
      }

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
    } else if (types[baseTypeName]) {
      sampleArg[propertyName] = getServiceMethodTestArgument(
        serviceTypes,
        functionName,
        baseTypeName,
        serviceMetadata,
        isUpdate,
        previousUpdateSampleArg?.[propertyName],
        true,
        typePropertyAnnotationContainer.isTypePropertyManyToMany(serviceTypes[argTypeName], propertyName)
      );
    }

    if (isArrayType) {
      if (propertyName.endsWith('Ids') && testValue === undefined) {
        sampleArg[propertyName] = [`{{${propertyName.slice(0, -3)}Id}}`];
      } else {
        sampleArg[propertyName] =
          defaultValueStr === undefined ? [sampleArg[propertyName]] : JSON.parse(defaultValueStr);
      }
    }
  });

  return sampleArg;
}
