import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { createNamespace } from 'cls-hooked';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import parser from 'cron-parser';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { HttpStatusCodes } from '../constants/constants';

export default async function tryInitializeCronJobSchedulingTable(dbManager: AbstractDbManager) {
  const clsNamespace = createNamespace('serviceFunctionExecution');

  await forEachAsyncParallel(
    Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()),
    async ([serviceFunctionName, cronSchedule]) => {
      const [, error] = await clsNamespace.runAndReturn(async () => {
        await dbManager.tryReserveDbConnectionFromPool();

        const [, error] = await dbManager.executeInsideTransaction(async () => {
          const [entity, error] = await dbManager.getEntityWhere(
            'serviceFunctionName',
            serviceFunctionName,
            __Backk__CronJobScheduling,
            undefined,
            true
          );

          const interval = parser.parseExpression(cronSchedule);

          if (error?.statusCode === HttpStatusCodes.NOT_FOUND) {
            return dbManager.createEntity(
              {
                serviceFunctionName,
                lastScheduledTimestamp: new Date(120000),
                nextScheduledTimestamp: interval.next().toDate()
              },
              __Backk__CronJobScheduling
            );
          } else if (entity) {
            return dbManager.updateEntity(
              {
                _id: entity._id,
                serviceFunctionName,
                lastScheduledTimestamp: new Date(120000),
                nextScheduledTimestamp: interval.next().toDate()
              },
              __Backk__CronJobScheduling
            );
          }

          return [entity, error];
        });

        dbManager.tryReleaseDbConnectionBackToPool();
        return [null, error];
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  );
}
