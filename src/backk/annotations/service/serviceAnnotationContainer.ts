class ServiceAnnotationContainer {
  private serviceClassNameToHasNoAutoTestsAnnotationMap: { [key: string]: boolean } = {};
  private serviceClassNameToAllowedUserRolesMap: { [key: string]: string[] } = {};

  addNoAutoTestsAnnotationToServiceClass(serviceClass: Function) {
    this.serviceClassNameToHasNoAutoTestsAnnotationMap[serviceClass.name] = true;
  }

  addAllowedUserRoles(serviceClass: Function, roles: string[]) {
    this.serviceClassNameToAllowedUserRolesMap[serviceClass.name] = roles;
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
