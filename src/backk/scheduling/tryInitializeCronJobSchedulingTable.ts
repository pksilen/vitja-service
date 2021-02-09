import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { createNamespace } from 'cls-hooked';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import parser from 'cron-parser';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { HttpStatusCodes } from '../constants/constants';
import isErrorResponse from '../errors/isErrorResponse';

export default async function tryInitializeCronJobSchedulingTable(dbManager: AbstractDbManager) {
  await forEachAsyncParallel(
    Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()),
    async ([serviceFunctionName, cronSchedule]) => {
      const clsNamespace = createNamespace('serviceFunctionExecution');
      const possibleErrorResponse = await clsNamespace.runAndReturn(async () => {
        await dbManager.tryReserveDbConnectionFromPool();
        const possibleErrorResponse = await dbManager.executeInsideTransaction(async () => {
          const entityOrErrorResponse = await dbManager.getEntityWhere(
            'serviceFunctionName',
            serviceFunctionName,
            __Backk__CronJobScheduling
          );

          const interval = parser.parseExpression(cronSchedule);

          if (isErrorResponse(entityOrErrorResponse, HttpStatusCodes.NOT_FOUND)) {
            return dbManager.createEntity(
              {
                serviceFunctionName,
                lastScheduledTimestamp: new Date(120000),
                nextScheduledTimestamp: interval.next().toDate()
              },
              __Backk__CronJobScheduling
            );
          } else if (!('errorMessage' in entityOrErrorResponse)) {
            return await dbManager.updateEntity(
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

          return entityOrErrorResponse;
        });

        dbManager.tryReleaseDbConnectionBackToPool();
        return possibleErrorResponse;
      });

      if (possibleErrorResponse && 'errorMessage' in possibleErrorResponse) {
        throw new Error(possibleErrorResponse.errorMessage);
      }
    }
  );
}
