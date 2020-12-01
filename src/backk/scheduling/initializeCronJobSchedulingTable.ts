import AbstractDbManager from "../dbmanager/AbstractDbManager";
import serviceFunctionAnnotationContainer
  from "../decorators/service/function/serviceFunctionAnnotationContainer";
import { createNamespace } from "cls-hooked";
import CronJobScheduling from "./entities/CronJobScheduling";
import parser from "cron-parser";

export default function initializeCronJobSchedulingTable(dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const clsNamespace = createNamespace('serviceFunctionExecution');
      clsNamespace.run(async () => {
        await dbManager.tryReserveDbConnectionFromPool();
        await dbManager.executeInsideTransaction(async () => {
          const entityOrErrorResponse = await dbManager.getEntityBy(
            'serviceFunctionName',
            serviceFunctionName,
            CronJobScheduling
          );

          const interval = parser.parseExpression(cronSchedule);
          if ('errorMessage' in entityOrErrorResponse) {
            await dbManager.createEntity(
              {
                serviceFunctionName,
                lastScheduledTimestamp: new Date(0),
                nextScheduledTimestamp: interval.next().toDate()
              },
              CronJobScheduling
            );
          } else if (entityOrErrorResponse.lastScheduledTimestamp.valueOf() !== 0) {
            await dbManager.updateEntity(
              {
                _id: entityOrErrorResponse._id,
                serviceFunctionName,
                lastScheduledTimestamp: new Date(0),
                nextScheduledTimestamp: interval.next().toDate()
              },
              CronJobScheduling
            );
          }
        });
        dbManager.tryReleaseDbConnectionBackToPool();
      });
    }
  );
}
