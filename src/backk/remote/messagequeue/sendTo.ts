import { CompressionTypes, Kafka, logLevel, Producer, Transaction } from 'kafkajs';
import getServiceName from '../../utils/getServiceName';
import { ErrorResponse } from '../../types/ErrorResponse';
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import log, { Severity, severityNameToSeverityMap } from '../../observability/logging/log';
import { getNamespace } from 'cls-hooked';
import { Send } from './sendInsideTransaction';
import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import tracerProvider from "../../observability/distributedtracinig/tracerProvider";

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

const logCreator = () => ({ label, log: { message, ...extra } }: any) =>
  log(severityNameToSeverityMap[label], 'Message queue error', message, extra);

export async function sendOneOrMore(sendTos: Send[], transactional: boolean) {
  const { scheme, broker, topic } = parseRemoteServiceUrlParts(sendTos[0].remoteServiceUrl);

  if (scheme !== 'kafka') {
    throw new Error('Only kafka scheme is supported');
  }

  if (!kafkaBrokerToKafkaClientMap[broker]) {
    kafkaBrokerToKafkaClientMap[broker] = new Kafka({
      clientId: getServiceName(),
      logLevel: minimumLoggingSeverityToKafkaLoggingLevelMap[process.env.LOG_LEVEL ?? 'INFO'],
      brokers: [broker],
      logCreator
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
      async ({ remoteServiceUrl, options, serviceFunction, serviceFunctionArgument }: Send) => {
        log(Severity.DEBUG, 'Send to remote service for execution', '', {
          remoteServiceUrl,
          serviceFunction
        });

        const span = tracerProvider.getTracer('default').startSpan('kafkajs: SEND_MESSAGE');
        span.setAttribute('component', 'kafkajs');
        span.setAttribute('span.kind', 'CLIENT');
        span.setAttribute('peer.address', broker);
        span.setAttribute('kafka.topic', topic);
        span.setAttribute('kafka.message.key', serviceFunction);

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
          span.setAttribute('status.name', 'ERROR');
          span.setAttribute('status.code', 1);
          span.setAttribute('error.message', error.message);
          throw error;
        } finally {
          span.end();
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
  return await sendOneOrMore(
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
