import testValueContainer from './testValueContainer';

export function ExpectInTestsToMatch(expr: string){
  // eslint-disable-next-line
  return function(object: Object, propertyName: string) {
    testValueContainer.addExpectTestValueToMatch(object.constructor, propertyName, expr);
  };
}
