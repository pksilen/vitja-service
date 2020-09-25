class TestValueContainer {
  private testValues: { [key: string]: any } = {};
  private expectAnyTestValue: { [key: string]: boolean } = {};
  private testValuesToMatch: { [key: string]: string } = {};

  addTestValue(type: Function, propertyName: string, testValue: any) {
    this.testValues[`${type.name}${propertyName}`] = testValue;
  }

  addExpectTestValueToMatch(type: Function, propertyName: string, expr: string) {
    this.testValuesToMatch[`${type.name}${propertyName}`] = expr;
  }

  addExpectAnyTestValue(type: Function, propertyName: string) {
    this.expectAnyTestValue[`${type.name}${propertyName}`] = true;
  }

  getTestValue(type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.testValues[`${proto.constructor.name}${propertyName}`] !== undefined) {
        return this.testValues[`${proto.constructor.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  getTestValueToMatch(type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.testValuesToMatch[`${proto.constructor.name}${propertyName}`] !== undefined) {
        return this.testValuesToMatch[`${proto.constructor.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }
  }

  getExpectAnyTestValue(type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.expectAnyTestValue[`${proto.constructor.name}${propertyName}`] !== undefined) {
        return this.expectAnyTestValue[`${proto.constructor.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }
  }
}

export default new TestValueContainer();
