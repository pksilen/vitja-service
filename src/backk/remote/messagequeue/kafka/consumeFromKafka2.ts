import { KafkaConsumer } from "node-rdkafka";
import getNamespacedServiceName from "../../../utils/getServiceNamespace";
import { ITopicConfig } from "kafkajs";

let consumer: any;

export default async function consumeFromKafka2(
  controller: any,
  server: string | undefined,
  defaultTopic: string = getNamespacedServiceName(),
  defaultTopicConfig?: Omit<ITopicConfig, 'topic'>,
  additionalTopics?: string[]
) {
  if (!server) {
    throw new Error('Kafka server not defined');
  }

  const replicationFactor =
    process.env.NODE_ENV === 'development'
      ? 1
      : parseInt(process.env.KAFKA_DEFAULT_TOPIC_NUM_PARTITIONS ?? '3', 10);

  const numPartitions =
    process.env.NODE_ENV === 'development'
      ? 1
      : parseInt(process.env.KAFKA_DEFAULT_TOPIC_NUM_PARTITIONS ?? '3', 10);

  const finalDefaultTopicConfig = defaultTopicConfig ?? {
    replicationFactor,
    numPartitions,
    configEntries: [
      {
        name: 'retention.ms',
        value: process.env.KAFKA_DEFAULT_TOPIC_RETENTION_MS ?? (5 * 60 * 1000).toString()
      }
    ]
  };

  const consumer = new KafkaConsumer({
    'group.id': 'kafka',
    'metadata.broker.list': 'localhost:9092',
  }, {});

  consumer.connect();

  consumer
    .on('ready', function() {
      consumer.subscribe([defaultTopic]);
      consumer.consume();
    })
    .on('data', function(data) {
      console.log(data.value?.toString());
    });
}
