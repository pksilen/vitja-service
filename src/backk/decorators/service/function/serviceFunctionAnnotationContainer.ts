import { ErrorCodeAndMessage } from '../../../dbmanager/hooks/PreHook';

class ServiceFunctionAnnotationContainer {
  private readonly serviceFunctionNameToHasNoCaptchaAnnotationMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToIsAllowedForEveryUserMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToIsAllowedForClusterInternalUseMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToIsAllowedForSelfMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToIsPrivateMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToAllowedUserRolesMap: { [key: string]: string[] } = {};
  private readonly serviceFunctionNameToDocStringMap: { [key: string]: string } = {};
  private readonly serviceFunctionNameToExpectedResponseStatusCodeInTestsMap: { [key: string]: number } = {};
  private readonly serviceFunctionNameToAllowedForTestsMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToErrorsMap: { [key: string]: ErrorCodeAndMessage[] } = {};
  private readonly serviceFunctionNameToIsNotTransactionalMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToIsNotDistributedTransactionalMap: { [key: string]: boolean } = {};
  private readonly serviceFunctionNameToCronScheduleMap: { [key: string]: string } = {};
  private readonly serviceFunctionNameToRetryIntervalsInSecsMap: { [key: string]: number[] } = {};
  private readonly serviceFunctionNameToIsUpdateFunctionMap: { [key: string]: boolean } = {};

  addNoCaptchaAnnotation(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToHasNoCaptchaAnnotationMap[`${serviceClass.name}${functionName}`] = true;
  }

  addAllowedUserRoles(serviceClass: Function, functionName: string, roles: string[]) {
    this.serviceFunctionNameToAllowedUserRolesMap[`${serviceClass.name}${functionName}`] = roles;
  }

  addServiceFunctionAllowedForEveryUser(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsAllowedForEveryUserMap[`${serviceClass.name}${functionName}`] = true;
  }

  addServiceFunctionAllowedForClusterInternalUse(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsAllowedForClusterInternalUseMap[`${serviceClass.name}${functionName}`] = true;
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

  addServiceFunctionAllowedForTests(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToAllowedForTestsMap[`${serviceClass.name}${functionName}`] = true;
  }

  addErrorsForServiceFunction(serviceClass: Function, functionName: string, errors: ErrorCodeAndMessage[]) {
    this.serviceFunctionNameToErrorsMap[`${serviceClass.name}${functionName}`] = errors;
  }

  addNonTransactionalServiceFunction(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsNotTransactionalMap[`${serviceClass.name}${functionName}`] = true;
  }

  addNonDistributedTransactionalServiceFunction(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsNotDistributedTransactionalMap[`${serviceClass.name}${functionName}`] = true;
  }

  addCronScheduleForServiceFunction(serviceClass: Function, functionName: string, cronSchedule: string) {
    this.serviceFunctionNameToCronScheduleMap[
      `${serviceClass.name.charAt(0).toLowerCase() + serviceClass.name.slice(1)}.${functionName}`
    ] = cronSchedule;
  }

  addRetryIntervalsInSecsForServiceFunction(
    serviceClass: Function,
    functionName: string,
    retryIntervalsInSecs: number[]
  ) {
    this.serviceFunctionNameToRetryIntervalsInSecsMap[
      `${serviceClass.name.charAt(0).toLowerCase() + serviceClass.name.slice(1)}.${functionName}`
    ] = retryIntervalsInSecs;
  }

  addUpdateAnnotation(serviceClass: Function, functionName: string) {
    this.serviceFunctionNameToIsUpdateFunctionMap[`${serviceClass.name}${functionName}`] = true;
  }

  getAllowedUserRoles(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToAllowedUserRolesMap[`${proto.constructor.name}${functionName}`] !==
        undefined
      ) {
        return this.serviceFunctionNameToAllowedUserRolesMap[`${proto.constructor.name}${functionName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return [];
  }

  isServiceFunctionAllowedForEveryUser(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsAllowedForEveryUserMap[`${proto.constructor.name}${functionName}`] !==
        undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isServiceFunctionAllowedForClusterInternalUse(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsAllowedForClusterInternalUseMap[
          `${proto.constructor.name}${functionName}`
        ] !== undefined
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
        this.serviceFunctionNameToIsAllowedForSelfMap[`${proto.constructor.name}${functionName}`] !==
        undefined
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
      if (this.serviceFunctionNameToIsPrivateMap[`${proto.constructor.name}${functionName}`] !== undefined) {
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
        this.serviceFunctionNameToHasNoCaptchaAnnotationMap[`${proto.constructor.name}${functionName}`] !==
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
      if (this.serviceFunctionNameToDocStringMap[`${proto.constructor.name}${functionName}`] !== undefined) {
        return this.serviceFunctionNameToDocStringMap[`${proto.constructor.name}${functionName}`];
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
          `${proto.constructor.name}${functionName}`
        ] !== undefined
      ) {
        return this.serviceFunctionNameToExpectedResponseStatusCodeInTestsMap[
          `${proto.constructor.name}${functionName}`
        ];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return undefined;
  }

  isServiceFunctionAllowedForTests(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToAllowedForTestsMap[`${proto.constructor.name}${functionName}`] !== undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  getErrorsForServiceFunction(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (this.serviceFunctionNameToErrorsMap[`${proto.constructor.name}${functionName}`] !== undefined) {
        return this.serviceFunctionNameToErrorsMap[`${proto.constructor.name}${functionName}`];
      }
      proto = Object.getPrototypeOf(proto);
    }

    return undefined;
  }

  isServiceFunctionNonTransactional(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsNotTransactionalMap[`${proto.constructor.name}${functionName}`] !==
        undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isServiceFunctionNonDistributedTransactional(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsNotDistributedTransactionalMap[
          `${proto.constructor.name}${functionName}`
        ] !== undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  isUpdateServiceFunction(serviceClass: Function, functionName: string) {
    let proto = Object.getPrototypeOf(new (serviceClass as new () => any)());
    while (proto !== Object.prototype) {
      if (
        this.serviceFunctionNameToIsUpdateFunctionMap[`${proto.constructor.name}${functionName}`] !==
        undefined
      ) {
        return true;
      }
      proto = Object.getPrototypeOf(proto);
    }

    return false;
  }

  getServiceFunctionNameToCronScheduleMap() {
    return this.serviceFunctionNameToCronScheduleMap;
  }

  getServiceFunctionNameToRetryIntervalsInSecsMap() {
    return this.serviceFunctionNameToRetryIntervalsInSecsMap;
  }
}

export default new ServiceFunctionAnnotationContainer();
