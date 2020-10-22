import testValueContainer from './testValueContainer';

export function ValueUsedInTests(testValue: any){
  // eslint-disable-next-line
  return function(object: Object, propertyName: string) {
    testValueContainer.addTestValue(object.constructor, propertyName, testValue);
  };
}
