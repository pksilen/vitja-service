import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export type PostTestSpec = {
  testName: string;
  serviceFunctionName: string;
  expectedResult: {
    [key: string]: any;
  };
};

export type FieldPathNameToFieldValueMap = {
  [key: string]: any;
};

export function PostTest(testSpec: PostTestSpec) {
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
