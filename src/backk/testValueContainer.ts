class TestValueContainer {
  private testValues: { [key: string]: any } = {};

  addTestValue(type: Function, propertyName: string, testValue: any) {
    this.testValues[`${type.name}${propertyName}`] = testValue;
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
}

export default new TestValueContainer();
