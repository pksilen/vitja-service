class ServiceAnnotationContainer {
  private serviceClassNameToHasNoAutoTestsAnnotationMap: { [key: string]: boolean } = {};

  addNoAutoTestsAnnotationToServiceClass(serviceClass: Function) {
    this.serviceClassNameToHasNoAutoTestsAnnotationMap[serviceClass.name] = true;
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
