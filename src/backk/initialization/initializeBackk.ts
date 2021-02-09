import AbstractDbManager from "../dbmanager/AbstractDbManager";
import logEnvironment from "../observability/logging/logEnvironment";
import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import reloadLoggingConfigOnChange from "../configuration/reloadLoggingConfigOnChange";
import log, { Severity } from "../observability/logging/log";
import scheduleCronJobsForExecution from "../scheduling/scheduleCronJobsForExecution";
import scheduledJobsForExecution from "../scheduling/scheduledJobsForExecution";
import ReadinessCheckService from "../readinesscheck/ReadinessCheckService";

export default async function initializeBackk(controller: any, dbManager: AbstractDbManager) {
  ReadinessCheckService.controller = controller;
  logEnvironment();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(controller, dbManager);
  scheduleCronJobsForExecution(controller, dbManager);
  await scheduledJobsForExecution(controller, dbManager);
  reloadLoggingConfigOnChange();
  log(Severity.INFO, 'Service started', '');
}
