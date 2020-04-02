class TestValueContainer {
  private testValues: { [key: string]: any } = {};

  addTestValue(typeName: string, propertyName: string , testValue: any) {
    this.testValues[`${typeName}${propertyName}`] = testValue;
  }

  getTestValue(typeName: string, propertyName: string ) {
    return this.testValues[`${typeName}${propertyName}`]
  }
}

export default new TestValueContainer();
