import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { createNamespace } from 'cls-hooked';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import parser from 'cron-parser';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { logError } from '../observability/logging/log';

export default async function initializeCronJobSchedulingTable(dbManager: AbstractDbManager) {
  await forEachAsyncParallel(
    Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()),
    async ([serviceFunctionName, cronSchedule]) => {
      await dbManager.connectMongoDb();
      const clsNamespace = createNamespace('serviceFunctionExecution');
      await clsNamespace.runAndReturn(async () => {
        try {
          await dbManager.tryReserveDbConnectionFromPool();
          await dbManager.executeInsideTransaction(async () => {
            const entityOrErrorResponse = await dbManager.getEntityWhere(
              'serviceFunctionName',
              serviceFunctionName,
              __Backk__CronJobScheduling
            );

            const interval = parser.parseExpression(cronSchedule);

            if ('errorMessage' in entityOrErrorResponse) {
              await dbManager.createEntity(
                {
                  serviceFunctionName,
                  lastScheduledTimestamp: new Date(120000),
                  nextScheduledTimestamp: interval.next().toDate()
                },
                __Backk__CronJobScheduling
              );
            } else {
              await dbManager.updateEntity(
                {
                  _id: entityOrErrorResponse._id,
                  serviceFunctionName,
                  lastScheduledTimestamp: new Date(120000),
                  nextScheduledTimestamp: interval.next().toDate()
                },
                __Backk__CronJobScheduling,
                []
              );
            }
          });

          dbManager.tryReleaseDbConnectionBackToPool();
        } catch (error) {
          logError(error);
        }
      });
    }
  );
}
