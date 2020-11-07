import { CompressionTypes, Kafka, logLevel } from 'kafkajs';
import getServiceName from '../../utils/getServiceName';
import { ErrorResponse } from '../../types/ErrorResponse';
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import log, { Severity } from '../../observability/logging/log';
import { getNamespace } from 'cls-hooked';

const kafkaBrokerToKafkaClientMap: { [key: string]: Kafka } = {};

const minimumLoggingSeverityToKafkaLoggingLevelMap: { [key: string]: number } = {
  DEBUG: logLevel.DEBUG,
  INFO: logLevel.INFO,
  WARN: logLevel.WARN,
  ERROR: logLevel.ERROR
};

enum SendAcknowledgementType {
  NONE,
  LEADER_ONLY,
  ALL_REPLICAS
}

export interface SendToOptions {
  compressionType?: CompressionTypes;
  sendAcknowledgementType?: SendAcknowledgementType;
}

function parseRemoteServiceUrlParts(remoteServiceUrl: string) {
  const scheme = remoteServiceUrl.slice(0, 5);
  const [broker, topic] = remoteServiceUrl.slice(8).split('/');
  return { scheme, broker, topic };
}

export default async function sendTo(
  remoteServiceUrl: string,
  serviceFunction: string,
  serviceFunctionArgument: object,
  options?: SendToOptions
): Promise<void | ErrorResponse> {
  log(Severity.DEBUG, 'Send to remote service for execution', '', { remoteServiceUrl, serviceFunction });
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

  const authHeader = getNamespace('serviceFunctionExecution')?.get('authHeader');
  const kafkaClient = kafkaBrokerToKafkaClientMap[broker];
  const producer = kafkaClient.producer();

  try {
    await producer.connect();
    await producer.send({
      topic,
      compression: options?.compressionType ?? CompressionTypes.None,
      acks: options?.sendAcknowledgementType ?? SendAcknowledgementType.ALL_REPLICAS,
      messages: [
        {
          key: serviceFunction,
          value: JSON.stringify(serviceFunctionArgument),
          headers: { Authorization: authHeader }
        }
      ]
    });
  } catch (error) {
    log(Severity.ERROR, error.message, error.stack, { remoteServiceUrl, serviceFunction });
    return createErrorResponseFromError(error);
  } finally {
    try {
      await producer.disconnect();
    } catch (error) {
      // NOOP
    }
  }
}
