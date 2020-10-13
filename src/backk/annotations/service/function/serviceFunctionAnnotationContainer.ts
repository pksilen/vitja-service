class ServiceFunctionAnnotationContainer {
  private serviceFunctionNameToHasNoCaptchaAnnotationMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToIsAllowedForEveryUserMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToIsAllowedForInternalUseMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToIsAllowedForSelfMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToIsPrivateMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToAllowedUserRolesMap: { [key: string]: string[] } = {};
  private serviceFunctionNameToDocStringMap: { [key: string]: string } = {};
  private serviceFunctionNameToExpectedResponseStatusCodeInTestsMap: { [key: string]: number } = {};

  addNoCaptchaAnnotation(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToHasNoCaptchaAnnotationMap[`${serviceClass.name}${functionName}`] = true;
  }

  addAllowedUserRoles(serviceClass: Function, functionName: string, roles: string[]) {
    this.serviceFunctionNameToAllowedUserRolesMap[`${serviceClass.name}${functionName}`] = roles;
  }

  addServiceFunctionAllowedForEveryUser(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsAllowedForEveryUserMap[`${serviceClass.name}${functionName}`] = true;
  }

  addServiceFunctionAllowedForInternalUse(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsAllowedForInternalUseMap[`${serviceClass.name}${functionName}`] = true;
  }

  addServiceFunctionAllowedForSelf(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsAllowedForSelfMap[`${serviceClass.name}${functionName}`] = true;
  }

  addPrivateServiceFunction(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsPrivateMap[`${serviceClass.name}${functionName}`] = true;
  }

  addDocumentationForServiceFunction(serviceClass: Function, functionName: string, docString: string) {
    this.serviceFunctionNameToDocStringMap[`${serviceClass.name}${functionName}`] = docString;
  }

  addExpectedResponseStatusCodeInTestsForServiceFunction(
    serviceClass: Function,
    functionName: string,
    statusCode: number
  ) {
    this.serviceFunctionNameToExpectedResponseStatusCodeInTestsMap[
      `${serviceClass.name}${functionName}`
    ] = statusCode;
  }

  getAllowedUserRoles(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToAllowedUserRolesMap[`${serviceClass.name}${functionName}`] !== undefined
      ) {
        return this.serviceFunctionNameToAllowedUserRolesMap[`${serviceClass.name}${functionName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return [];
  }

  isServiceFunctionAllowedForEveryUser(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsAllowedForEveryUserMap[`${serviceClass.name}${functionName}`] !==
        undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isServiceFunctionAllowedForInternalUse(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsAllowedForInternalUseMap[`${serviceClass.name}${functionName}`] !==
        undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isServiceFunctionAllowedForSelf(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsAllowedForSelfMap[`${serviceClass.name}${functionName}`] !== undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isServiceFunctionPrivate(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceFunctionNameToIsPrivateMap[`${serviceClass.name}${functionName}`] !== undefined) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  hasNoCaptchaAnnotationForServiceFunction(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToHasNoCaptchaAnnotationMap[`${serviceClass.name}${functionName}`] !==
        undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  getDocumentationForServiceFunction(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceFunctionNameToDocStringMap[`${serviceClass.name}${functionName}`] !== undefined) {
        return this.serviceFunctionNameToDocStringMap[`${serviceClass.name}${functionName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return undefined;
  }

  getExpectedResponseStatusCodeInTestsForServiceFunction(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToExpectedResponseStatusCodeInTestsMap[
          `${serviceClass.name}${functionName}`
        ] !== undefined
      ) {
        return this.serviceFunctionNameToExpectedResponseStatusCodeInTestsMap[
          `${serviceClass.name}${functionName}`
        ];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return undefined;
  }
}

export default new ServiceFunctionAnnotationContainer();
