import tryExecuteServiceFunction, { ExecuteServiceFunctionOptions } from './tryExecuteServiceFunction';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { ServiceFunctionCall } from './ServiceFunctionCall';
import { ServiceFunctionCallResponse } from './ServiceFunctionCallResponse';
import PartialResponse from './PartialResponse';

export default async function executeMultipleServiceFunctionsInParallel(
  controller: any,
  serviceFunctionArgument: object,
  headers: { [key: string]: string },
  resp?: any,
  options?: ExecuteServiceFunctionOptions
): Promise<void | object> {
  const serviceFunctionCallIdToResponseMap: { [key: string]: ServiceFunctionCallResponse } = {};
  const statusCodes: number[] = [];

  await forEachAsyncParallel(
    Object.entries(serviceFunctionArgument),
    async ([serviceFunctionCallId, { serviceFunctionName, serviceFunctionArgument }]: [
      string,
      ServiceFunctionCall
    ]) => {
      const partialResponse = new PartialResponse();

      await tryExecuteServiceFunction(
        controller,
        serviceFunctionName,
        serviceFunctionArgument,
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

  resp.status(Math.max(...statusCodes));
  resp.send(serviceFunctionCallIdToResponseMap);
}
