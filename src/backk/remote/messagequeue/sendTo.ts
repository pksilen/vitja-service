import { CompressionTypes, Kafka, logLevel, Producer, Transaction } from 'kafkajs';
import getServiceName from '../../utils/getServiceName';
import { ErrorResponse } from '../../types/ErrorResponse';
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import log, { Severity } from '../../observability/logging/log';
import { getNamespace } from 'cls-hooked';
import { SendTo } from './sendInsideTransaction';
import forEachAsyncSequential from '../../utils/forEachAsyncSequential';

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

export function parseRemoteServiceUrlParts(remoteServiceUrl: string) {
  const scheme = remoteServiceUrl.slice(0, 5);
  const [broker, topic] = remoteServiceUrl.slice(8).split('/');
  return { scheme, broker, topic };
}

export async function sendOneOrMoreTo(sendTos: SendTo[], transactional: boolean) {
  const { scheme, broker, topic } = parseRemoteServiceUrlParts(sendTos[0].remoteServiceUrl);

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
  let transaction;

  try {
    await producer.connect();
    
    let producerOrTransaction: Producer | Transaction;
    if (transactional) {
      transaction = await producer.transaction();
      producerOrTransaction = transaction;
    } else {
      producerOrTransaction = producer;
    }

    await forEachAsyncSequential(
      sendTos,
      async ({ remoteServiceUrl, options, serviceFunction, serviceFunctionArgument }: SendTo) => {
        log(Severity.DEBUG, 'Send to remote service for execution', '', {
          remoteServiceUrl,
          serviceFunction
        });

        try {
          await producerOrTransaction.send({
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
          throw error;
        }
      }
    );

    await transaction?.commit();
  } catch (error) {
    await transaction?.abort();
    return createErrorResponseFromError(error);
  } finally {
    try {
      await producer.disconnect();
    } catch (error) {
      // NOOP
    }
  }
}

export default async function sendTo(
  remoteServiceUrl: string,
  serviceFunction: string,
  serviceFunctionArgument: object,
  options?: SendToOptions
): Promise<void | ErrorResponse> {
  return await sendOneOrMoreTo(
    [
      {
        remoteServiceUrl,
        serviceFunction,
        serviceFunctionArgument,
        options
      }
    ],
    false
  );
}
