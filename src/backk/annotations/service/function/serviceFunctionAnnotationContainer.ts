class ServiceFunctionAnnotationContainer {
  private serviceFunctionNameToHasNoCaptchaAnnotationMap: { [key: string]: boolean } = {};

  addNoCaptchaAnnotation(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToHasNoCaptchaAnnotationMap[`${serviceClass.name}${functionName}`] = true;
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
