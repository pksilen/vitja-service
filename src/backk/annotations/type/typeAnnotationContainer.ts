class TypeAnnotationContainer {
  private typePropertyNameToDocStringMap: { [key: string]: string } = {};

  addDocumentationForTypeProperty(Type: Function, propertyName: string, docString: string) {
    this.typePropertyNameToDocStringMap[`${Type.name}${propertyName}`] = docString;
  }

  getDocumentationForTypeProperty(Type: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToDocStringMap[`${Type.name}${functionName}`] !== undefined) {
        return this.typePropertyNameToDocStringMap[`${Type.name}${functionName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return undefined;
  }
}

export default new TypeAnnotationContainer();
