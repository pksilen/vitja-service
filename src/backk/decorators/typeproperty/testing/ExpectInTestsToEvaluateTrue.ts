import testValueContainer from './testValueContainer';

export function ExpectInTestsToEvaluateTrue(func: (entity: any) => boolean){
  // eslint-disable-next-line
  return function(object: Object, propertyName: string) {
    testValueContainer.addExpectTestValueToMatch(object.constructor, propertyName, func);
  };
}
