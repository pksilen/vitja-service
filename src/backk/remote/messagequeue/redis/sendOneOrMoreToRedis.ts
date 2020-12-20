import Redis from 'ioredis';
import { CallOrSendTo } from '../sendInsideTransaction';
import parseRemoteServiceFunctionCallUrlParts from '../../utils/parseRemoteServiceFunctionCallUrlParts';
import { getNamespace } from 'cls-hooked';
import forEachAsyncSequential from '../../../utils/forEachAsyncSequential';
import log, { Severity } from '../../../observability/logging/log';
import createErrorResponseFromError from '../../../errors/createErrorResponseFromError';
import { ErrorResponse } from '../../../types/ErrorResponse';
import defaultServiceMetrics from '../../../observability/metrics/defaultServiceMetrics';

export default async function sendOneOrMoreToRedis(
  sends: CallOrSendTo[],
  isTransactional: boolean
): Promise<void | ErrorResponse> {
  const remoteServiceUrl = sends[0].remoteServiceFunctionUrl;
  const { server, topic } = parseRemoteServiceFunctionCallUrlParts(remoteServiceUrl);
  const redis = new Redis(server);
  const authHeader = getNamespace('serviceFunctionExecution')?.get('authHeader');

  try {
    if (isTransactional) {
      redis.multi();
    }

    await forEachAsyncSequential(
      sends,
      async ({ responseUrl, remoteServiceFunctionUrl, serviceFunctionArgument }: CallOrSendTo) => {
        const { serviceFunctionName } = parseRemoteServiceFunctionCallUrlParts(remoteServiceFunctionUrl);
        log(Severity.DEBUG, 'CallOrSendTo to remote service for execution', '', {
          serviceFunctionCallUrl: remoteServiceFunctionUrl,
          serviceFunction: serviceFunctionName
        });

        defaultServiceMetrics.incrementRemoteServiceCallCountByOne(remoteServiceFunctionUrl);
        await redis.rpush(
          topic,
          JSON.stringify({
            serviceFunctionName,
            serviceFunctionArgument,
            headers: {
              Authorization: authHeader,
              responseUrl
            }
          })
        );
      }
    );

    if (isTransactional) {
      await redis.exec();
    }
  } catch (error) {
    defaultServiceMetrics.incrementRemoteServiceCallErrorCountByOne(remoteServiceUrl);
    return createErrorResponseFromError(error);
  }
}
