import BaseService from '../service/BaseService';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import getPrototypeOf = Reflect.getPrototypeOf;

export default async function executeOnStartUpTasks(controller: any) {
  const serviceNameToServiceEntries = Object.entries(controller).filter(
    ([, service]: [string, any]) => service instanceof BaseService
  );

  await forEachAsyncParallel(serviceNameToServiceEntries, async ([, service]: [string, any]) => {
    await forEachAsyncParallel(Object.getOwnPropertyNames(getPrototypeOf(service)), async (functionName: string) => {
      if (serviceFunctionAnnotationContainer.hasOnStartUp(service.constructor, functionName)) {
        await service[functionName]();
      }
    });
  });
}
