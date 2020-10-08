class TypeAnnotationContainer {
  private typePropertyNameToDocStringMap: { [key: string]: string } = {};
  private typePropertyNameToIsUniqueMap: { [key: string]: boolean } = {};

  addDocumentationForTypeProperty(Type: Function, propertyName: string, docString: string) {
    this.typePropertyNameToDocStringMap[`${Type.name}${propertyName}`] = docString;
  }

  setTypePropertyAsUnique(Type: Function, propertyName: string) {
    this.typePropertyNameToIsUniqueMap[`${Type.name}${propertyName}`] = true;
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

  isTypePropertyUnique(Type: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsUniqueMap[`${Type.name}${functionName}`] !== undefined) {
        return this.typePropertyNameToIsUniqueMap[`${Type.name}${functionName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }
}

export default new TypeAnnotationContainer();
