import testValueContainer from './testValueContainer';

export function ExpectAnyValueInTests(){
  // eslint-disable-next-line
  return function(object: Object, propertyName: string) {
    testValueContainer.addExpectAnyTestValue(object.constructor, propertyName);
  };
}
