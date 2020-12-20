import { Kafka } from 'kafkajs';
import minimumLoggingSeverityToKafkaLoggingLevelMap from './minimumLoggingSeverityToKafkaLoggingLevelMap';
import logCreator from './logCreator';
import tryExecuteServiceMethod from '../../../execution/tryExecuteServiceMethod';
import tracerProvider from '../../../observability/distributedtracinig/tracerProvider';
import log, { Severity } from '../../../observability/logging/log';
import { CanonicalCode, Span } from '@opentelemetry/api';
import defaultServiceMetrics from '../../../observability/metrics/defaultServiceMetrics';
import forEachAsyncParallel from '../../../utils/forEachAsyncParallel';
import isErrorResponse from '../../../errors/isErrorResponse';
import { ErrorResponse } from '../../../types/ErrorResponse';
import { HttpStatusCodes } from '../../../constants/constants';
import sendToRemoteService from '../sendToRemoteService';
import getNamespacedServiceName from '../../../utils/getServiceNamespace';
import Response from '../../../execution/Response';
import delay from "../../../utils/delay";

export default async function consumeFromKafka(
  controller: any,
  server: string,
  defaultTopic: string = getNamespacedServiceName(),
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
    clientId: getNamespacedServiceName(),
    logLevel: minimumLoggingSeverityToKafkaLoggingLevelMap[process.env.LOG_LEVEL ?? 'INFO'],
    brokers: [server],
    logCreator
  });

  const consumer = kafkaClient.consumer({ groupId: getNamespacedServiceName() });
  let fetchSpan: Span | undefined;
  let hasFetchError = false;

  consumer.on(consumer.events.CONNECT, (event) => {
    log(Severity.INFO, 'Kafka: consumer connected to server', '', event);
  });

  consumer.on(consumer.events.GROUP_JOIN, (event) => {
    log(Severity.INFO, 'Kafka: consumer joined consumer group', '', event);
  });

  consumer.on(consumer.events.STOP, (event) => {
    log(Severity.INFO, 'Kafka: consumer has stopped', '', event);
  });

  consumer.on(consumer.events.DISCONNECT, (event) => {
    log(Severity.INFO, 'Kafka: consumer disconnected from server', '', event);
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
    log(Severity.ERROR, 'Kafka: consumer request to server has timed out', '', event);
    defaultServiceMetrics.incrementKafkaConsumerRequestTimeoutsByOne();
    hasFetchError = true;
    fetchSpan?.setStatus({
      code: CanonicalCode.UNKNOWN,
      message: 'Consumer request to server has timed out'
    });
  });

  consumer.on(consumer.events.HEARTBEAT, (event) => {
    log(Severity.DEBUG, 'Kafka: Heartbeat sent to coordinator', '', event);
  });

  consumer.on(consumer.events.FETCH_START, () => {
    log(Severity.DEBUG, 'Kafka: started fetch messages from server', '');
    fetchSpan = tracerProvider.getTracer('default').startSpan('kafkajs.consumer.FETCH_START');
    hasFetchError = false;
    fetchSpan.setAttribute('component', 'kafkajs');
    fetchSpan.setAttribute('span.kind', 'CLIENT');
    fetchSpan.setAttribute('peer.address', server);
  });

  consumer.on(consumer.events.FETCH, (event) => {
    log(Severity.DEBUG, 'Kafka: finished fetching messages from server', '', event);
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

  admin.on(admin.events.CONNECT, (event) => {
    log(Severity.DEBUG, 'Kafka: admin client connected to server', '', event);
  });

  admin.on(admin.events.DISCONNECT, (event) => {
    log(Severity.DEBUG, 'Kafka: admin client disconnected from server', '', event);
  });

  try {
    await admin.connect();

    const didCreateDefaultTopic = await admin.createTopics({
      topics: [
        {
          topic: defaultTopic,
          ...defaultTopicConfig
        }
      ]
    });

    if (didCreateDefaultTopic) {
      log(Severity.INFO, 'Kafka: admin client created default topic', '', {
        defaultTopic,
        ...defaultTopicConfig
      });
    }

    await admin.disconnect();

    await consumer.connect();
    await consumer.subscribe({ topic: defaultTopic });
    await forEachAsyncParallel(additionalTopics ?? [], async (topic) => await consumer.subscribe({ topic }));
    await consumer.run({
      eachMessage: async ({ message: { key, value, headers } }) => {
        const serviceFunctionName = key.toString();
        const valueStr = value?.toString();
        const serviceFunctionArgument = valueStr ? JSON.parse(valueStr) : undefined;

        const response = new Response();
        await tryExecuteServiceMethod(
          controller,
          serviceFunctionName,
          serviceFunctionArgument,
          (headers as any) ?? {}
        );

        if (response.getStatusCode() >= HttpStatusCodes.INTERNAL_ERRORS_START) {
          await delay(10000);
          await sendToRemoteService(
            'kafka://' + server + '/' + defaultTopic + '/' + serviceFunctionName,
            serviceFunctionArgument
          );
        } else if (headers?.responseUrl && response) {
          await sendToRemoteService(headers.responseUrl as string, response);
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
