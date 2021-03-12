import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export type TestSpec = {
  testName: string,
  fieldPathNameToFieldValueMap: {
    [key: string]: any;
  };
}

export type FieldPathNameToFieldValueMap = {
  [key: string]: any;
};

export function TestEntityAfterwards(
  testName: string,
  expectedFieldPathNameToFieldValueMap: FieldPathNameToFieldValueMap
) {
  const finalFieldPathNameToFieldValueMap = Object.entries(expectedFieldPathNameToFieldValueMap).reduce(
    (finalFieldPathNameToFieldValueMap, [fieldPathName, fieldValue]) => {
      let finalFieldValue = fieldValue;

      if (typeof fieldValue === 'string' && fieldValue.startsWith('{{') && fieldValue.endsWith('}}')) {
        const idFieldName = fieldValue.slice(2, -2).trim();
        finalFieldValue = `pm.collectionVariables.get('${idFieldName}')`;
      }

      return {
        ...finalFieldPathNameToFieldValueMap,
        [fieldPathName]: finalFieldValue
      };
    },
    {}
  );

  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.expectServiceFunctionEntityToContainInTests(
      object.constructor,
      functionName,
      testName,
      finalFieldPathNameToFieldValueMap
    );
  };
}
