import generateServicesDocumentation from "../documentation/generateServicesDocumentation";
import defaultSystemAndNodeJsMetrics from "../observability/metrics/defaultSystemAndNodeJsMetrics";
import initializeDatabase from "../dbmanager/sql/operations/ddl/initializeDatabase";
import { postgreSqlDbManager } from "../../database/postgreSqlDbManager";
import executeScheduledCronJobs from "../scheduling/executeScheduledCronJobs";
import executeScheduledJobs from "../scheduling/executeScheduledJobs";
import log, { Severity } from "../observability/logging/log";

export default async function initializeBackk(app: any) {
  generateServicesDocumentation();
  defaultSystemAndNodeJsMetrics.startCollectingMetrics();
  await initializeDatabase(postgreSqlDbManager);
  executeScheduledCronJobs(postgreSqlDbManager);
  executeScheduledJobs(postgreSqlDbManager);
  await app.listen(3000);
  log(Severity.INFO, 'Service started', '');
}
