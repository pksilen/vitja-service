import AbstractDbManager from "../dbmanager/AbstractDbManager";
import logEnvironment from "../observability/logging/logEnvironment";
import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import reloadLoggingConfigOnChange from "../configuration/reloadLoggingConfigOnChange";
import log, { Severity } from "../observability/logging/log";
import executeCronJobs from "../scheduling/executeCronJobs";
import executeScheduledJobs from "../scheduling/executeScheduledJobs";
import executeOnStartUpTasks from "./executeOnStartUpTasks";

export default async function initializeBackk(controller: any, dbManager: AbstractDbManager) {
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  await executeOnStartUpTasks(controller, dbManager);
  executeCronJobs(controller, dbManager);
  await executeScheduledJobs(controller, dbManager);
  reloadLoggingConfigOnChange();
  log(Severity.INFO, 'Service started', '');
}
