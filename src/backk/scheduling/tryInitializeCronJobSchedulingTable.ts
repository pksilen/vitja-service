import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { createNamespace } from 'cls-hooked';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import parser from 'cron-parser';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { logError } from '../observability/logging/log';
import { HttpStatusCodes } from '../constants/constants';
import isErrorResponse from '../errors/isErrorResponse';

export default async function tryInitializeCronJobSchedulingTable(dbManager: AbstractDbManager) {
  await forEachAsyncParallel(
    Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()),
    async ([serviceFunctionName, cronSchedule]) => {
      const clsNamespace = createNamespace('serviceFunctionExecution');
      await clsNamespace.runAndReturn(async () => {
        await dbManager.tryReserveDbConnectionFromPool();
        await dbManager.executeInsideTransaction(async () => {
          const entityOrErrorResponse = await dbManager.getEntityWhere(
            'serviceFunctionName',
            serviceFunctionName,
            __Backk__CronJobScheduling
          );

          const interval = parser.parseExpression(cronSchedule);

          if (isErrorResponse(entityOrErrorResponse, HttpStatusCodes.NOT_FOUND)) {
            await dbManager.createEntity(
              {
                serviceFunctionName,
                lastScheduledTimestamp: new Date(120000),
                nextScheduledTimestamp: interval.next().toDate()
              },
              __Backk__CronJobScheduling
            );
          } else if (!('errorMessage' in entityOrErrorResponse)) {
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
          } else {
            throw entityOrErrorResponse.errorMessage;
          }
        });

        dbManager.tryReleaseDbConnectionBackToPool();
      });
    }
  );
}
