class ServiceAnnotationContainer {
  private serviceClassNameToHasNoAutoTestsAnnotationMap: { [key: string]: boolean } = {};
  private serviceClassNameToIsAllowedForEveryUserMap: { [key: string]: boolean } = {};
  private serviceClassNameToIsAllowedForInternalUseMap: { [key: string]: boolean } = {};
  private serviceClassNameToAllowedUserRolesMap: { [key: string]: string[] } = {};

  addNoAutoTestsAnnotationToServiceClass(serviceClass: Function) {
    this.serviceClassNameToHasNoAutoTestsAnnotationMap[serviceClass.name] = true;
  }

  addAllowedUserRolesForService(serviceClass: Function, roles: string[]) {
    this.serviceClassNameToAllowedUserRolesMap[serviceClass.name] = roles;
  }

  addServiceAllowedForEveryUser(serviceClass: Function) {
    this.serviceClassNameToIsAllowedForEveryUserMap[serviceClass.name] = true;
  }

  addServiceAllowedForInternalUse(serviceClass: Function) {
    this.serviceClassNameToIsAllowedForInternalUseMap[serviceClass.name] = true;
  }

  getAllowedUserRoles(serviceClass: Function) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceClassNameToAllowedUserRolesMap[proto.constructor.name] !== undefined) {
        return this.serviceClassNameToAllowedUserRolesMap[proto.constructor.name];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return [];
  }

  isServiceAllowedForEveryUser(serviceClass: Function) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceClassNameToIsAllowedForEveryUserMap[proto.constructor.name] !== undefined) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isServiceAllowedForInternalUse(serviceClass: Function) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceClassNameToIsAllowedForInternalUseMap[proto.constructor.name] !== undefined) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  hasNoAutoTestsAnnotationForServiceClass(serviceClass: Function) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceClassNameToHasNoAutoTestsAnnotationMap[proto.constructor.name] !== undefined) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }
}

export default new ServiceAnnotationContainer();
