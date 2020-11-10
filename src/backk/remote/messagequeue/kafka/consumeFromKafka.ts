import { Kafka } from 'kafkajs';
import getServiceName from '../../../utils/getServiceName';
import minimumLoggingSeverityToKafkaLoggingLevelMap from './minimumLoggingSeverityToKafkaLoggingLevelMap';
import parseRemoteServiceUrlParts from '../../utils/parseRemoteServiceUrlParts';
import logCreator from './logCreator';
import tryExecuteServiceFunction from '../../../execution/tryExecuteServiceFunction';
import tracerProvider from '../../../observability/distributedtracinig/tracerProvider';
import log, { Severity } from '../../../observability/logging/log';

export default async function consumeFromKafka(controller: any, remoteServiceUrl: string) {
  const { broker, topic } = parseRemoteServiceUrlParts(remoteServiceUrl);

  const kafkaClient = new Kafka({
    clientId: getServiceName(),
    logLevel: minimumLoggingSeverityToKafkaLoggingLevelMap[process.env.LOG_LEVEL ?? 'INFO'],
    brokers: [broker],
    logCreator
  });

  const consumer = kafkaClient.consumer({ groupId: getServiceName() });

  consumer.on(consumer.events.CONNECT, (event) => {
    log(Severity.INFO, 'Kafka: connected to broker', '', event);
  });

  consumer.on(consumer.events.GROUP_JOIN, (event) => {
    log(Severity.INFO, 'Kafka: joined consumer group', '', event);
  });

  consumer.on(consumer.events.STOP, (event) => {
    log(Severity.INFO, 'Kafka: consumer has stopped', '', event);
  });

  consumer.on(consumer.events.DISCONNECT, (event) => {
    log(Severity.INFO, 'Kafka: disconnect from broker', '', event);
  });

  consumer.on(consumer.events.CRASH, ({ error, ...restOfEvent }) => {
    log(Severity.ERROR, 'Kafka: consumer crashed due to error', error, restOfEvent);
  });

  consumer.on(consumer.events.REQUEST_TIMEOUT, (event) => {
    log(Severity.ERROR, 'Kafka: consumer request to broker has timed out', '', event);
  });

  consumer.on(consumer.events.HEARTBEAT, (event) => {
    log(Severity.DEBUG, 'Kafka: Heartbeat sent to coordinator', '', event);
  });

  consumer.on(consumer.events.FETCH_START, (event) => {
    log(Severity.DEBUG, 'Kafka: Heartbeat sent to coordinator', '', event);
  });

  try {
    await consumer.connect();
    await consumer.subscribe({ topic });
    await consumer.run({
      eachMessage: async ({ message: { key, value, headers } }) => {
        await tryExecuteServiceFunction(
          controller,
          key.toString(),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          JSON.parse(value!.toString()),
          headers?.Auhtorization as string
        );
      }
    });
  } catch (error) {
    // NOOP
  } finally {
    try {
      await consumer.disconnect();
    } catch {
      // NOOP
    }
  }
}
