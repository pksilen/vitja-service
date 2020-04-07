import testValueContainer from './testValueContainer';

export function TestValueType(testValueType: string){
  // eslint-disable-next-line
  return function(object: Object, propertyName: string) {
    testValueContainer.addTestValueType(object.constructor, propertyName, testValueType);
  };
}
