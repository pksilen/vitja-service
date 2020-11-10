import Redis from 'ioredis';
import { Send } from '../sendInsideTransaction';
import parseRemoteServiceUrlParts from '../../utils/parseRemoteServiceUrlParts';
import { getNamespace } from 'cls-hooked';
import forEachAsyncSequential from '../../../utils/forEachAsyncSequential';
import log, { Severity } from '../../../observability/logging/log';
import createErrorResponseFromError from '../../../errors/createErrorResponseFromError';
import { ErrorResponse } from '../../../types/ErrorResponse';
import defaultServiceMetrics from '../../../observability/metrics/defaultServiceMetrics';

export default async function sendOneOrMoreToRedis(
  sends: Send[],
  isTransactional: boolean
): Promise<void | ErrorResponse> {
  const remoteServiceUrl = sends[0].remoteServiceUrl;
  const { broker, topic } = parseRemoteServiceUrlParts(remoteServiceUrl);
  const redis = new Redis(broker);
  const authHeader = getNamespace('serviceFunctionExecution')?.get('authHeader');

  try {
    if (isTransactional) {
      redis.multi();
    }

    await forEachAsyncSequential(
      sends,
      async ({ remoteServiceUrl, options, serviceFunction, serviceFunctionArgument }: Send) => {
        log(Severity.DEBUG, 'Send to remote service for execution', '', {
          remoteServiceUrl,
          serviceFunction
        });

        defaultServiceMetrics.incrementRemoteServiceCallCountByOne(remoteServiceUrl);
        await redis.rpush(
          topic,
          JSON.stringify({
            serviceFunction,
            serviceFunctionArgument,
            headers: {
              Authorization: authHeader
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
