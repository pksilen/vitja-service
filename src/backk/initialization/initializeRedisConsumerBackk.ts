import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import log, { Severity } from "../observability/logging/log";
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import logEnvironment from "../observability/logging/logEnvironment";
import reloadLoggingConfigOnChange from "../configuration/reloadLoggingConfigOnChange";
import { appController } from "../../app/app.controller";
import consumeFromRedis from "../remote/messagequeue/redis/consumeFromRedis";

export default async function initializeRedisConsumerBackk(app: any, dbManager: AbstractDbManager) {
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  reloadLoggingConfigOnChange();
  log(Severity.INFO, 'Service started', '');
  await consumeFromRedis(appController, process.env.REDIS_SERVER, 'notification-service.vitja');
}
