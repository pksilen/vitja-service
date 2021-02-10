import AbstractDbManager from "../dbmanager/AbstractDbManager";
import BaseService from "../service/BaseService";
import forEachAsyncSequential from "../utils/forEachAsyncSequential";
import serviceFunctionAnnotationContainer
  from "../decorators/service/function/serviceFunctionAnnotationContainer";
import isErrorResponse from "../errors/isErrorResponse";
import { ErrorResponse } from "../types/ErrorResponse";
import { createNamespace } from "cls-hooked";

export default async function tryExecuteOnStartUpTasks(controller: any, dbManager: AbstractDbManager) {
  const clsNamespace = createNamespace('serviceFunctionExecution');
  const possibleErrorResponse = await clsNamespace.runAndReturn(async () => {
    await dbManager.tryReserveDbConnectionFromPool();

    const possibleErrorResponse: any = await dbManager.executeInsideTransaction(async () => {
      const serviceNameToServiceEntries = Object.entries(controller).filter(
        ([, service]: [string, any]) => service instanceof BaseService
      );

      try {
        await forEachAsyncSequential(serviceNameToServiceEntries, async ([, service]: [string, any]) => {
          await forEachAsyncSequential(
            Object.getOwnPropertyNames(Object.getPrototypeOf(service)),
            async (functionName: string) => {
              if (serviceFunctionAnnotationContainer.hasOnStartUp(service.constructor, functionName)) {
                const possibleErrorResponse: any | ErrorResponse = await service[functionName]();

                if (isErrorResponse(possibleErrorResponse)) {
                  throw new possibleErrorResponse();
                }
              }
            }
          );
        });
      } catch (errorResponse) {
        return errorResponse as ErrorResponse;
      }

      return undefined;
    });

    dbManager.tryReleaseDbConnectionBackToPool();
    return possibleErrorResponse;
  });

  if (possibleErrorResponse) {
    throw new Error(possibleErrorResponse.errorMessage);
  }
}
