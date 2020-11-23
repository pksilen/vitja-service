import Mustache from 'mustache';
import tryExecuteServiceFunction, { ExecuteServiceFunctionOptions } from './tryExecuteServiceFunction';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { ServiceFunctionCall } from './ServiceFunctionCall';
import { ServiceFunctionCallResponse } from './ServiceFunctionCallResponse';
import PartialResponse from './PartialResponse';
import forEachAsyncSequential from '../utils/forEachAsyncSequential';
import { createNamespace } from 'cls-hooked';
import BaseService from '../service/BaseService';

async function executeMultiple<T>(
  isConcurrent: boolean,
  serviceFunctionArgument: object,
  controller: any,
  headers: { [p: string]: string },
  options: ExecuteServiceFunctionOptions | undefined,
  serviceFunctionCallIdToResponseMap: { [p: string]: ServiceFunctionCallResponse },
  resp: any,
  statusCodes: number[]
) {
  const forEachFunc = isConcurrent ? forEachAsyncParallel : forEachAsyncSequential;

  await forEachFunc(
    Object.entries(serviceFunctionArgument),
    async ([serviceFunctionCallId, { serviceFunctionName, serviceFunctionArgument }]: [
      string,
      ServiceFunctionCall
    ]) => {
      const partialResponse = new PartialResponse();

      let renderedServiceFunctionArgument = serviceFunctionArgument;
      if (options?.shouldAllowTemplatesInMultipleServiceFunctionExecution ?? false) {
        renderedServiceFunctionArgument = Mustache.render(
          JSON.stringify(serviceFunctionArgument),
          serviceFunctionCallIdToResponseMap
        );
      }

      await tryExecuteServiceFunction(
        controller,
        serviceFunctionName,
        renderedServiceFunctionArgument,
        headers,
        partialResponse,
        options
      );

      serviceFunctionCallIdToResponseMap[serviceFunctionCallId] = {
        statusCode: resp.getStatusCode(),
        response: partialResponse.getResponse()
      };
      statusCodes.push(resp.getStatusCode());
    }
  );
}

export default async function executeMultipleServiceFunctions(
  isConcurrent: boolean,
  shouldExecuteInsideTransaction: boolean,
  controller: any,
  serviceFunctionArgument: object,
  headers: { [key: string]: string },
  resp?: any,
  options?: ExecuteServiceFunctionOptions
): Promise<void | object> {
  const serviceFunctionCallIdToResponseMap: { [key: string]: ServiceFunctionCallResponse } = {};
  const statusCodes: number[] = [];
  const services = Object.values(controller).filter((service) => service instanceof BaseService);
  const dbManager = (services as BaseService[])[0].getDbManager();

  const clsNamespace = createNamespace('multipleServiceFunctionExecutions');
  await clsNamespace.runAndReturn(async () => {
    clsNamespace.set('connection', true);
    await dbManager.tryReserveDbConnectionFromPool();

    if (shouldExecuteInsideTransaction) {
      await dbManager.executeInsideTransaction(async () => {
        clsNamespace.set('globalTransaction', true);
        await executeMultiple(
          isConcurrent,
          serviceFunctionArgument,
          controller,
          headers,
          options,
          serviceFunctionCallIdToResponseMap,
          resp,
          statusCodes
        );
        clsNamespace.set('globalTransaction', false);
      });
    } else {
      await executeMultiple(
        isConcurrent,
        serviceFunctionArgument,
        controller,
        headers,
        options,
        serviceFunctionCallIdToResponseMap,
        resp,
        statusCodes
      );
    }
  });

  dbManager.tryReleaseDbConnectionBackToPool();
  clsNamespace.set('connection', false);

  resp.status(Math.max(...statusCodes));
  resp.send(serviceFunctionCallIdToResponseMap);
}
