import { CompressionTypes, Kafka, logLevel } from 'kafkajs';
import getServiceName from '../utils/getServiceName';
import { ErrorResponse } from '../types/ErrorResponse';
import createErrorResponseFromError from '../errors/createErrorResponseFromError';
import log from '../observability/logging/log';

const kafkaBrokerToKafkaClientMap: { [key: string]: Kafka } = {};

const minimumLoggingSeverityToKafkaLoggingLevelMap: { [key: string]: number } = {
  DEBUG: logLevel.DEBUG,
  INFO: logLevel.INFO,
  WARN: logLevel.WARN,
  ERROR: logLevel.ERROR
};

function parseRemoteServiceUrlParts(remoteServiceUrl: string) {
  const scheme = remoteServiceUrl.slice(0, 5);
  const [broker, topic] = remoteServiceUrl.slice(8).split('/');
  return { scheme, broker, topic };
}

export default async function sendTo(
  remoteServiceUrl: string,
  serviceFunction: string,
  serviceFunctionArgument: object
): Promise<void | ErrorResponse> {
  log('DEBUG', 'Remote async service execution', '', { remoteServiceUrl, serviceFunction });
  const { scheme, broker, topic } = parseRemoteServiceUrlParts(remoteServiceUrl);

  if (scheme !== 'kafka') {
    throw new Error('Only kafka scheme is supported');
  }

  if (!kafkaBrokerToKafkaClientMap[broker]) {
    kafkaBrokerToKafkaClientMap[broker] = new Kafka({
      clientId: getServiceName(),
      logLevel: minimumLoggingSeverityToKafkaLoggingLevelMap[process.env.LOG_LEVEL ?? 'INFO'],
      brokers: [broker]
    });
  }

  const kafkaClient = kafkaBrokerToKafkaClientMap[broker];
  const producer = kafkaClient.producer();

  try {
    await producer.connect();
    await producer.send({
      topic,
      compression: CompressionTypes.GZIP,
      messages: [
        // TODO add authheader to headers property https://kafka.js.org/docs/producing
        { key: serviceFunction, value: JSON.stringify(serviceFunctionArgument) }
      ]
    });
  } catch (error) {
    log('ERROR', error.message, error.stack, { remoteServiceUrl, serviceFunction });
    return createErrorResponseFromError(error);
  } finally {
    try {
      await producer.disconnect();
    } catch (error) {
      // NOOP
    }
  }
}
