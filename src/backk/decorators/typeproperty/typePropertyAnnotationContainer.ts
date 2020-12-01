class TypePropertyAnnotationContainer {
  private readonly typePropertyNameToDocStringMap: { [key: string]: string } = {};
  private readonly typePropertyNameToIsUniqueMap: { [key: string]: boolean } = {};
  private readonly typePropertyNameToIsNotHashedMap: { [key: string]: boolean } = {};
  private readonly typePropertyNameToIsHashedMap: { [key: string]: boolean } = {};
  private readonly typePropertyNameToIsEncryptedMap: { [key: string]: boolean } = {};
  private readonly typePropertyNameToIsNotEncryptedMap: { [key: string]: boolean } = {};
  private readonly typePropertyNameToIsPrivateMap: { [key: string]: boolean } = {};
  private readonly typePropertyNameToIsManyToManyMap: { [key: string]: boolean } = {};

  addDocumentationForTypeProperty(Type: Function, propertyName: string, docString: string) {
    this.typePropertyNameToDocStringMap[`${Type.name}${propertyName}`] = docString;
  }

  setTypePropertyAsUnique(Type: Function, propertyName: string) {
    this.typePropertyNameToIsUniqueMap[`${Type.name}${propertyName}`] = true;
  }

  setTypePropertyAsNotHashed(Type: Function, propertyName: string) {
    this.typePropertyNameToIsNotHashedMap[`${Type.name}${propertyName}`] = true;
  }

  setTypePropertyAsHashed(Type: Function, propertyName: string) {
    this.typePropertyNameToIsHashedMap[`${Type.name}${propertyName}`] = true;
  }

  setTypePropertyAsEncrypted(Type: Function, propertyName: string) {
    this.typePropertyNameToIsEncryptedMap[`${Type.name}${propertyName}`] = true;
  }

  setTypePropertyAsNotEncrypted(Type: Function, propertyName: string) {
    this.typePropertyNameToIsNotEncryptedMap[`${Type.name}${propertyName}`] = true;
  }

  setTypePropertyAsPrivate(Type: Function, propertyName: string) {
    this.typePropertyNameToIsPrivateMap[`${Type.name}${propertyName}`] = true;
  }

  setTypePropertyAsManyToMany(Type: Function, propertyName: string) {
    this.typePropertyNameToIsManyToManyMap[`${Type.name}${propertyName}`] = true;
  }

  getDocumentationForTypeProperty(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToDocStringMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToDocStringMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return undefined;
  }

  isTypePropertyUnique(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsUniqueMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsUniqueMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isTypePropertyNotHashed(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsNotHashedMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsNotHashedMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isTypePropertyHashed(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsHashedMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsHashedMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isTypePropertyEncrypted(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsEncryptedMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsEncryptedMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isTypePropertyNotEncrypted(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsNotEncryptedMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsNotEncryptedMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isTypePropertyPrivate(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsPrivateMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsPrivateMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isTypePropertyManyToMany(Type: Function, propertyName: string) {
    let proto = Object.getPrototypeOf(new (Type as new () => any)());
    while (proto !== Object.prototype) {
      if (this.typePropertyNameToIsManyToManyMap[`${Type.name}${propertyName}`] !== undefined) {
        return this.typePropertyNameToIsManyToManyMap[`${Type.name}${propertyName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }
}

export default new TypePropertyAnnotationContainer();
