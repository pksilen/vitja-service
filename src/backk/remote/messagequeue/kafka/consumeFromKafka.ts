import { Kafka } from 'kafkajs';
import getServiceName from '../../../utils/getServiceName';
import minimumLoggingSeverityToKafkaLoggingLevelMap from './minimumLoggingSeverityToKafkaLoggingLevelMap';
import logCreator from './logCreator';
import tryExecuteServiceFunction from '../../../execution/tryExecuteServiceFunction';
import tracerProvider from '../../../observability/distributedtracinig/tracerProvider';
import log, { Severity } from '../../../observability/logging/log';
import { CanonicalCode, Span } from '@opentelemetry/api';
import defaultServiceMetrics from '../../../observability/metrics/defaultServiceMetrics';
import forEachAsyncParallel from '../../../utils/forEachAsyncParallel';
import isErrorResponse from '../../../errors/isErrorResponse';
import { ErrorResponse } from '../../../types/ErrorResponse';
import { HttpStatusCodes } from '../../../constants/constants';
import sendTo from '../sendTo';
import getNamespacedServiceName from '../../../utils/getServiceNamespace';

export default async function consumeFromKafka(
  controller: any,
  broker: string,
  defaultTopic?: string,
  defaultTopicConfig = {
    numPartitions: parseInt(process.env.KAFKA_DEFAULT_TOPIC_NUM_PARTITIONS ?? '3'),
    replicationFactor: parseInt(process.env.KAFKA_DEFAULT_TOPIC_REPLICATION_FACTOR ?? '3'),
    configEntries: [
      {
        name: 'retention.ms',
        value: parseInt(process.env.KAFKA_DEFAULT_TOPIC_RETENTION_MS ?? (5 * 60 * 1000).toString())
      }
    ]
  },
  additionalTopics?: string[]
) {
  const kafkaClient = new Kafka({
    clientId: getServiceName(),
    logLevel: minimumLoggingSeverityToKafkaLoggingLevelMap[process.env.LOG_LEVEL ?? 'INFO'],
    brokers: [broker],
    logCreator
  });

  const consumer = kafkaClient.consumer({ groupId: getServiceName() });
  let fetchSpan: Span | undefined;
  let hasFetchError = false;

  consumer.on(consumer.events.CONNECT, (event) => {
    log(Severity.INFO, 'Kafka: consumer connected to broker', '', event);
  });

  consumer.on(consumer.events.GROUP_JOIN, (event) => {
    log(Severity.INFO, 'Kafka: consumer joined consumer group', '', event);
  });

  consumer.on(consumer.events.STOP, (event) => {
    log(Severity.INFO, 'Kafka: consumer has stopped', '', event);
  });

  consumer.on(consumer.events.DISCONNECT, (event) => {
    log(Severity.INFO, 'Kafka: consumer disconnected from broker', '', event);
  });

  consumer.on(consumer.events.CRASH, ({ error, ...restOfEvent }) => {
    log(Severity.ERROR, 'Kafka: consumer crashed due to error', error, restOfEvent);
    defaultServiceMetrics.incrementKafkaConsumerErrorsByOne();
    hasFetchError = true;
    fetchSpan?.setStatus({
      code: CanonicalCode.UNKNOWN,
      message: error
    });
  });

  consumer.on(consumer.events.REQUEST_TIMEOUT, (event) => {
    log(Severity.ERROR, 'Kafka: consumer request to broker has timed out', '', event);
    defaultServiceMetrics.incrementKafkaConsumerRequestTimeoutsByOne();
    hasFetchError = true;
    fetchSpan?.setStatus({
      code: CanonicalCode.UNKNOWN,
      message: 'Consumer request to broker has timed out'
    });
  });

  consumer.on(consumer.events.HEARTBEAT, (event) => {
    log(Severity.DEBUG, 'Kafka: Heartbeat sent to coordinator', '', event);
  });

  consumer.on(consumer.events.FETCH_START, () => {
    log(Severity.DEBUG, 'Kafka: started fetch messages from broker', '');
    fetchSpan = tracerProvider.getTracer('default').startSpan('kafkajs.consumer.FETCH_START');
    hasFetchError = false;
    fetchSpan.setAttribute('component', 'kafkajs');
    fetchSpan.setAttribute('span.kind', 'CLIENT');
    fetchSpan.setAttribute('peer.address', broker);
  });

  consumer.on(consumer.events.FETCH, (event) => {
    log(Severity.DEBUG, 'Kafka: finished fetching messages from broker', '', event);
    fetchSpan?.setAttribute('kafka.consumer.fetch.numberOfBatches', event.numberOfBatches);
    if (!hasFetchError) {
      fetchSpan?.setStatus({
        code: CanonicalCode.OK
      });
    }
    fetchSpan?.end();
    fetchSpan = undefined;
  });

  consumer.on(consumer.events.START_BATCH_PROCESS, (event) => {
    log(Severity.DEBUG, 'Kafka: started processing batch of messages', '', event);
  });

  consumer.on(consumer.events.END_BATCH_PROCESS, (event) => {
    log(Severity.DEBUG, 'Kafka: finished processing batch of messages', '', event);
    defaultServiceMetrics.recordKafkaConsumerOffsetLag(event.partition, event.offsetLag);
  });

  consumer.on(consumer.events.COMMIT_OFFSETS, (event) => {
    log(Severity.DEBUG, 'Kafka: committed offsets', '', event);
  });

  const admin = kafkaClient.admin();
  const topic = defaultTopic ?? getNamespacedServiceName();

  admin.on(admin.events.CONNECT, (event) => {
    log(Severity.DEBUG, 'Kafka: admin client connected to broker', '', event);
  });

  admin.on(admin.events.DISCONNECT, (event) => {
    log(Severity.DEBUG, 'Kafka: admin client disconnected from broker', '', event);
  });

  try {
    await admin.connect();
    const didCreateTopic = await admin.createTopics({
      topics: [
        {
          topic,
          ...defaultTopicConfig
        }
      ]
    });
    if (didCreateTopic) {
      log(Severity.INFO, 'Kafka: admin client created topic', '', { topic, ...defaultTopicConfig });
    }
    await admin.disconnect();

    await consumer.connect();
    await consumer.subscribe({ topic });
    await forEachAsyncParallel(additionalTopics ?? [], async (topic) => await consumer.subscribe({ topic }));
    await consumer.run({
      eachMessage: async ({ message: { key, value, headers } }) => {
        const serviceFunction = key.toString();
        const serviceFunctionArgument = JSON.parse(value?.toString() ?? '');
        const response = await tryExecuteServiceFunction(
          controller,
          serviceFunction,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          serviceFunctionArgument,
          headers?.Auhtorization as string
        );

        if (
          isErrorResponse(response) &&
          (response as ErrorResponse).statusCode >= HttpStatusCodes.INTERNAL_ERRORS_START
        ) {
          await sendTo('kafka://' + broker + '/' + topic + '/' + serviceFunction, serviceFunctionArgument);
        } else if (headers?.responseUrl && response) {
          await sendTo(headers.responseUrl as string, response);
        }
      }
    });
  } catch (error) {
    // NOOP
  } finally {
    try {
      await consumer.disconnect();
      await admin.disconnect();
    } catch {
      // NOOP
    }
  }
}
