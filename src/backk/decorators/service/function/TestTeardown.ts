import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export type TestTeardownSpec = {
  testName: string;
  serviceFunctionName: string;
  expectedResult: {
    [key: string]: any;
  };
};

export type FieldPathNameToFieldValueMap = {
  [key: string]: any;
};

export function TestTeardown(testSpec: TestTeardownSpec) {
  const finalFieldPathNameToFieldValueMap = Object.entries(
    testSpec.expectedResult
  ).reduce((finalFieldPathNameToFieldValueMap, [fieldPathName, fieldValue]) => {
    let finalFieldValue = fieldValue;

    if (typeof fieldValue === 'string' && fieldValue.startsWith('{{') && fieldValue.endsWith('}}')) {
      const idFieldName = fieldValue.slice(2, -2).trim();
      finalFieldValue = `pm.collectionVariables.get('${idFieldName}')`;
    }

    return {
      ...finalFieldPathNameToFieldValueMap,
      [fieldPathName]: finalFieldValue
    };
  }, {});

  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.expectServiceFunctionEntityToContainInTests(
      object.constructor,
      functionName,
      testSpec.testName,
      testSpec.serviceFunctionName,
      finalFieldPathNameToFieldValueMap
    );
  };
}
