class ServiceFunctionAnnotationContainer {
  private serviceFunctionNameToHasNoCaptchaAnnotationMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToIsAllowedForEveryUserMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToIsAllowedForInternalUseMap: { [key: string]: boolean } = {};
  private serviceFunctionNameToAllowedUserRolesMap: { [key: string]: string[] } = {};

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

  getAllowedUserRoles(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToAllowedUserRolesMap[`${serviceClass.name}${functionName}`] !==
        undefined
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
}

export default new ServiceFunctionAnnotationContainer();