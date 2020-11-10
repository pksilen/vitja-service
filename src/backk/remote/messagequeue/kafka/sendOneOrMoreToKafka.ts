import { CompressionTypes, Kafka, Producer, Transaction } from 'kafkajs';
import getServiceName from '../../../utils/getServiceName';
import { getNamespace } from 'cls-hooked';
import tracerProvider from '../../../observability/distributedtracinig/tracerProvider';
import forEachAsyncSequential from '../../../utils/forEachAsyncSequential';
import { Send } from '../sendInsideTransaction';
import log, { Severity } from '../../../observability/logging/log';
import { CanonicalCode } from '@opentelemetry/api';
import createErrorResponseFromError from '../../../errors/createErrorResponseFromError';
import parseRemoteServiceUrlParts from '../../utils/parseRemoteServiceUrlParts';
import { ErrorResponse } from '../../../types/ErrorResponse';
import minimumLoggingSeverityToKafkaLoggingLevelMap from './minimumLoggingSeverityToKafkaLoggingLevelMap';
import logCreator from './logCreator';

const kafkaBrokerToKafkaClientMap: { [key: string]: Kafka } = {};

export enum SendAcknowledgementType {
  NONE,
  LEADER_ONLY,
  ALL_REPLICAS
}

export default async function sendOneOrMoreToKafka(
  sends: Send[],
  isTransactional: boolean
): Promise<void | ErrorResponse> {
  const { broker, topic } = parseRemoteServiceUrlParts(sends[0].remoteServiceUrl);

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
  const producer = kafkaClient.producer(isTransactional ? { maxInFlightRequests: 1, idempotent: true } : {});
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
      sends,
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
        span.setAttribute('kafka.producer.message.key', serviceFunction);

        try {
          await producerOrTransaction.send({
            topic,
            compression: options?.compressionType ?? CompressionTypes.None,
            acks: isTransactional
              ? SendAcknowledgementType.ALL_REPLICAS
              : options?.sendAcknowledgementType ?? SendAcknowledgementType.ALL_REPLICAS,
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