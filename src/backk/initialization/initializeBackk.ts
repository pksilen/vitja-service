import generateServicesDocumentation from "../documentation/generateServicesDocumentation";
import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import { postgreSqlDbManager } from "../../database/postgreSqlDbManager";
import executeScheduledCronJobs from "../scheduling/executeScheduledCronJobs";
import executeScheduledJobs from "../scheduling/executeScheduledJobs";
import log, { Severity } from "../observability/logging/log";
import AbstractDbManager from "../dbmanager/AbstractDbManager";

export default async function initializeBackk(app: any, dbManager: AbstractDbManager) {
  generateServicesDocumentation();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(dbManager);
  executeScheduledCronJobs(dbManager);
  executeScheduledJobs(dbManager);
  await app.listen(3000);
  log(Severity.INFO, 'Service started', '');
}
