import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import log, { Severity } from "../observability/logging/log";
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import logEnvironment from "../observability/logging/logEnvironment";
import reloadLoggingConfigOnChange from "../configuration/reloadLoggingConfigOnChange";
import consumeFromKafka from "../remote/messagequeue/kafka/consumeFromKafka";
import { appController } from "../../app/app.controller";
import { ITopicConfig } from "kafkajs";

export default async function initializeKafkaConsumerBackk(
  app: any,
  dbManager: AbstractDbManager,
  defaultTopicConfig?: Omit<ITopicConfig, 'topic'>,
  additionalTopics?: string[]
) {
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  reloadLoggingConfigOnChange();
  log(Severity.INFO, 'Service started', '');

  await consumeFromKafka(
    appController,
    process.env.KAFKA_SERVER,
    'notification-service.vitja',
    defaultTopicConfig,
    additionalTopics
  );
}
