import { Kafka } from "kafkajs";
import getServiceName from "../../../utils/getServiceName";
import minimumLoggingSeverityToKafkaLoggingLevelMap from "./minimumLoggingSeverityToKafkaLoggingLevelMap";
import parseRemoteServiceUrlParts from "../../utils/parseRemoteServiceUrlParts";
import logCreator from "./logCreator";
import tryExecuteServiceFunction from "../../../execution/tryExecuteServiceFunction";

export default async function consumeFromKafka(controller: any, remoteServiceUrl: string) {
  const { broker, topic } = parseRemoteServiceUrlParts(remoteServiceUrl);

  const kafkaClient = new Kafka({
    clientId: getServiceName(),
    logLevel: minimumLoggingSeverityToKafkaLoggingLevelMap[process.env.LOG_LEVEL ?? 'INFO'],
    brokers: [broker],
    logCreator
  });

  const consumer = kafkaClient.consumer({ groupId: getServiceName() });

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
