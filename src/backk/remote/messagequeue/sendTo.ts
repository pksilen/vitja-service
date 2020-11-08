import { CompressionTypes, Kafka, logLevel, Producer, Transaction } from 'kafkajs';
import getServiceName from '../../utils/getServiceName';
import { ErrorResponse } from '../../types/ErrorResponse';
import createErrorResponseFromError from '../../errors/createErrorResponseFromError';
import log, { Severity, severityNameToSeverityMap } from '../../observability/logging/log';
import { getNamespace } from 'cls-hooked';
import { Send } from './sendInsideTransaction';
import forEachAsyncSequential from '../../utils/forEachAsyncSequential';
import tracerProvider from '../../observability/distributedtracinig/tracerProvider';
import { CanonicalCode } from '@opentelemetry/api';

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

export async function sendOneOrMore(sendTos: Send[], isTransactional: boolean) {
  const clsNamespace = getNamespace('serviceFunctionExecution');
  clsNamespace?.set('remoteServiceCallCount', clsNamespace?.get('remoteServiceCallCount') + 1);

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
  const producerConnectSpan = tracerProvider.getTracer('default').startSpan('kafkajs.producer.connect');
  let transactionSpan;

  try {
    producerConnectSpan.setAttribute('component', 'kafkajs');
    producerConnectSpan.setAttribute('span.kind', 'CLIENT');
    producerConnectSpan.setAttribute('peer.address', broker);
    await producer.connect();

    let producerOrTransaction: Producer | Transaction;
    if (isTransactional) {
      transaction = await producer.transaction();
      producerOrTransaction = transaction;
      transactionSpan = tracerProvider.getTracer('default').startSpan('kafkajs.producer.transaction');
      transactionSpan.setAttribute('component', 'kafkajs');
      transactionSpan.setAttribute('span.kind', 'CLIENT');
      transactionSpan.setAttribute('peer.address', broker);
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

        const span = tracerProvider
          .getTracer('default')
          .startSpan(isTransactional ? 'kafkajs.transaction.send' : 'kafkajs.producer.send');

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
          span.setStatus({
            code: CanonicalCode.OK
          });
        } catch (error) {
          log(Severity.ERROR, error.message, error.stack, { remoteServiceUrl, serviceFunction });
          span.setStatus({
            code: CanonicalCode.UNKNOWN,
            message: error.message
          });
          throw error;
        } finally {
          span.end();
        }
      }
    );

    await transaction?.commit();
    transactionSpan?.setStatus({
      code: CanonicalCode.OK
    });
    producerConnectSpan?.setStatus({
      code: CanonicalCode.OK
    });
  } catch (error) {
    await transaction?.abort();

    transactionSpan?.setStatus({
      code: CanonicalCode.UNKNOWN,
      message: error.message
    });

    producerConnectSpan?.setStatus({
      code: CanonicalCode.UNKNOWN,
      message: error.message
    });

    return createErrorResponseFromError(error);
  } finally {
    try {
      await producer.disconnect();
    } catch (error) {
      // NOOP
    }
    transactionSpan?.end();
    producerConnectSpan.end();
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
