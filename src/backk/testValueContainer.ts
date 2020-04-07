class TestValueContainer {
  private testValues: { [key: string]: any } = {};
  private testValueTypes: { [key: string]: string } = {};

  addTestValue(type: Function, propertyName: string, testValue: any) {
    this.testValues[`${type.name}${propertyName}`] = testValue;
  }

  addTestValueType(type: Function, propertyName: string, testValueType: string) {
    this.testValueTypes[`${type.name}${propertyName}`] = testValueType;
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

  getTestValueType(type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.testValueTypes[`${proto.constructor.name}${propertyName}`] !== undefined) {
        return this.testValueTypes[`${proto.constructor.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }
  }
}

export default new TestValueContainer();
