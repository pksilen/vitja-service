import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import log, { Severity } from "../observability/logging/log";
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import logEnvironment from "../observability/logging/logEnvironment";
import reloadLoggingConfigOnChange from "../configuration/reloadLoggingConfigOnChange";

export default async function initializeHttpServerBackk(app: any, dbManager: AbstractDbManager) {
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  reloadLoggingConfigOnChange();
  log(Severity.INFO, 'Service started', '');
  await app.listen(3000);
}
