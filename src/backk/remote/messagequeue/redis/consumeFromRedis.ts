/* eslint-disable no-constant-condition */
import Redis from 'ioredis';
import getServiceName from '../../../utils/getServiceName';
import tryExecuteServiceMethod from '../../../execution/tryExecuteServiceMethod';
import isErrorResponse from '../../../errors/isErrorResponse';
import { ErrorResponse } from '../../../types/ErrorResponse';
import { HttpStatusCodes } from '../../../constants/constants';
import sendTo from '../sendTo';
import log, { Severity } from '../../../observability/logging/log';
import defaultServiceMetrics from '../../../observability/metrics/defaultServiceMetrics';
import getNamespacedServiceName from '../../../utils/getServiceNamespace';

export default async function consumeFromRedis(
  controller: any,
  broker: string,
  topic = getNamespacedServiceName()
) {
  const redis = new Redis(broker);
  let lastQueueLengthUpdateTimestamp = 0;

  // noinspection InfiniteLoopJS
  while (true) {
    try {
      const valueJson = await redis.lpop(topic);
      log(Severity.DEBUG, 'Redis: consume message from queue', '', { broker, topic });
      const { serviceFunction, serviceFunctionArgument, headers } = JSON.parse(valueJson);

      const response = await tryExecuteServiceMethod(
        controller,
        serviceFunction,
        serviceFunctionArgument,
        headers.Auhtorization
      );

      if (
        isErrorResponse(response) &&
        (response as ErrorResponse).statusCode >= HttpStatusCodes.INTERNAL_ERRORS_START
      ) {
        await sendTo('redis://' + broker + '/' + topic + '/' + serviceFunction, serviceFunctionArgument);
      } else if (headers?.responseUrl && response) {
        await sendTo(headers.responseUrl as string, response);
      }

      const now = Date.now();
      if (now - lastQueueLengthUpdateTimestamp >= 5000) {
        const queueLength = await redis.llen(topic);
        defaultServiceMetrics.recordRedisConsumerQueueLength(queueLength);
        lastQueueLengthUpdateTimestamp = now;
      }
    } catch (error) {
      log(Severity.ERROR, 'Redis: ' + error.message, error.stack, { broker, topic });
      defaultServiceMetrics.incrementRedisConsumerErrorCounteByOne();
    }
  }
}
