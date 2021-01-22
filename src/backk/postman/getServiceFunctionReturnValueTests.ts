import testValueContainer from '../decorators/typeproperty/testing/testValueContainer';
import getValidationConstraint from '../validation/getValidationConstraint';
import { ServiceMetadata } from '../metadata/types/ServiceMetadata';
import getTypeInfoForTypeName from '../utils/type/getTypeInfoForTypeName';
import isEnumTypeName from '../utils/type/isEnumTypeName';
import parseEnumValuesFromSrcFile from '../typescript/parser/parseEnumValuesFromSrcFile';
import typePropertyAnnotationContainer from '../decorators/typeproperty/typePropertyAnnotationContainer';
import getCustomValidationConstraint from '../validation/getCustomValidationConstraint';

export default function getServiceFunctionReturnValueTests(
  serviceTypes: { [key: string]: Function },
  returnValueTypeName: string,
  serviceMetadata: ServiceMetadata,
  responsePath: string,
  isOptional: boolean,
  isUpdate: boolean,
  sampleArg: object | undefined,
  isRecursive = false,
  isManyToMany = false
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
    if (
      propertyName === 'version' ||
      propertyName === 'createdAtTimestamp' ||
      propertyName === 'lastModifiedTimestamp'
    ) {
      return;
    }

    if (sampleArg && (sampleArg as any)[propertyName] === undefined) {
      return;
    }

    // eslint-disable-next-line prefer-const
    let { baseTypeName, isArrayType, isNullableType, isOptionalType } = getTypeInfoForTypeName(
      propertyTypeName
    );

    isOptionalType = isOptionalType || isOptional;
    let expectedValue: any;
    let allowAnyValue;
    const testValue = testValueContainer.getTestValue(serviceTypes[returnValueTypeName], propertyName);

    const expectAnyTestValue = testValueContainer.getExpectAnyTestValue(
      serviceTypes[returnValueTypeName],
      propertyName
    );

    const testValueToEvaluate = testValueContainer.getTestValueToEvaluateTrue(
      serviceTypes[returnValueTypeName],
      propertyName
    );

    const minValue =
      getValidationConstraint(serviceTypes[returnValueTypeName], propertyName, 'min') ??
      getCustomValidationConstraint(serviceTypes[returnValueTypeName], propertyName, 'minMax', 1);

    const maxValue =
      getValidationConstraint(serviceTypes[returnValueTypeName], propertyName, 'max') ??
      getCustomValidationConstraint(serviceTypes[returnValueTypeName], propertyName, 'minMax', 2);

    if (isManyToMany) {
      isUpdate = false;
    }

    let isBooleanValue;
    if (testValue !== undefined) {
      if (typeof testValue === 'string') {
        expectedValue = "'" + testValue + "'";
      } else {
        expectedValue = testValue;
      }
    } else if (expectAnyTestValue !== undefined) {
      allowAnyValue = true;
    } else if (propertyName === '_id') {
      if (isRecursive) {
        expectedValue = `pm.collectionVariables.get('${returnValueTypeName.charAt(0).toLowerCase() +
          returnValueTypeName.slice(1)}Id')`;
      } else {
        expectedValue = `pm.collectionVariables.get('${serviceEntityName}Id')`;
      }
    } else if (propertyName.endsWith('Id')) {
      expectedValue = `pm.collectionVariables.get('${propertyName}')`;
    } else if (propertyName === 'id') {
      expectedValue = "'0'";
    } else if (isNullableType && !isUpdate && !types[baseTypeName]) {
      expectedValue = null;
    } else {
      switch (baseTypeName) {
        case 'string':
          expectedValue = isUpdate ? "'abcd'" : "'abc'";
          break;
        case 'boolean':
          expectedValue = !isUpdate;
          isBooleanValue = true;
          break;
        case 'integer':
        case 'bigint':
          expectedValue = isUpdate ? maxValue : minValue;
          break;
        case 'number':
          expectedValue = isUpdate ? parseFloat(maxValue.toFixed(2)) : parseFloat(minValue.toFixed(2));
          break;
        case 'Date':
          expectedValue = isUpdate
            ? `'${new Date(120000).toISOString()}'`
            : `'${new Date(60000).toISOString()}'`;
      }
    }

    if (isEnumTypeName(baseTypeName)) {
      let enumValues;
      if (baseTypeName.startsWith('(')) {
        enumValues = baseTypeName.slice(1).split(/[|)]/);
      } else {
        enumValues = parseEnumValuesFromSrcFile(baseTypeName);
      }
      expectedValue = isUpdate && enumValues.length >= 3 ? enumValues[1] : enumValues[0];
    } else if (types[baseTypeName]) {
      const finalResponsePath = responsePath + propertyName + (isArrayType ? '[0]' : '') + '.';
      const returnValueTests = getServiceFunctionReturnValueTests(
        serviceTypes,
        baseTypeName,
        serviceMetadata,
        finalResponsePath,
        isOptional,
        isUpdate,
        sampleArg
          ? Array.isArray((sampleArg as any)[propertyName])
            ? (sampleArg as any)[propertyName][0]
            : (sampleArg as any)[propertyName]
          : undefined,
        true,
        typePropertyAnnotationContainer.isTypePropertyManyToMany(
          serviceTypes[returnValueTypeName],
          propertyName
        )
      );

      javascriptLines.push(
        `if (response${responsePath}${propertyName} !== undefined && (response${responsePath}${propertyName}.length === undefined || response${responsePath}${propertyName}.length > 0)) {`
      );
      javascriptLines = javascriptLines.concat(returnValueTests);
      javascriptLines.push('}');
      return javascriptLines;
    }

    let expectation;
    if (testValueToEvaluate) {
      expectation = `pm.expect((${testValueToEvaluate})(response${responsePath.slice(0, -1)})).to.eql(true);`;
    } else if (isBooleanValue) {
      expectation = `pm.expect(response${responsePath}${propertyName}).to.${
        expectedValue ? 'be.ok' : 'not.be.ok'
      }`;
    } else {
      expectation = `pm.expect(response${responsePath}${propertyName}).to.eql(${expectedValue});`;
    }

    if (!allowAnyValue) {
      if (isOptionalType) {
        if (isArrayType) {
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
        if (isArrayType) {
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