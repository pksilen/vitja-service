import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import log, { Severity } from "../observability/logging/log";
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import logEnvironment from "../observability/logging/logEnvironment";
import reloadLoggingConfigOnChange from "../configuration/reloadLoggingConfigOnChange";

export default async function initializeBackk(app: any, dbManager: AbstractDbManager, startHttpServer: boolean) {
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  reloadLoggingConfigOnChange();

  if (startHttpServer) {
    await app.listen(3000);
  }

  log(Severity.INFO, 'Service started', '');
}
