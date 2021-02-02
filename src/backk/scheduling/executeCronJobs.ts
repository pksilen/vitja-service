import { CronJob } from 'cron';
import parser from 'cron-parser';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';
import { logError } from '../observability/logging/log';
import isErrorResponse from '../errors/isErrorResponse';
import tryExecuteServiceMethod from '../execution/tryExecuteServiceMethod';
import findServiceFunctionArgumentType from '../metadata/findServiceFunctionArgumentType';

const cronJobs: { [key: string]: CronJob } = {};

export default function executeCronJobs(controller: any, dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const job = new CronJob(cronSchedule, async () => {
        const retryIntervalsInSecs = serviceFunctionAnnotationContainer.getServiceFunctionNameToRetryIntervalsInSecsMap()[
          serviceFunctionName
        ];
        const interval = parser.parseExpression(cronSchedule);
        await findAsyncSequential([0, ...retryIntervalsInSecs], async (retryIntervalInSecs) => {
          await delay(retryIntervalInSecs * 1000);
          const clsNamespace = createNamespace('multipleServiceFunctionExecutions');
          const clsNamespace2 = createNamespace('serviceFunctionExecution');
          return await clsNamespace.runAndReturn(async () => {
            return await clsNamespace2.runAndReturn(async () => {
              try {
                await dbManager.tryReserveDbConnectionFromPool();
                clsNamespace.set('connection', true);
                const possibleErrorResponse = await dbManager.executeInsideTransaction(async () => {
                  clsNamespace.set('globalTransaction', true);

                  const possibleErrorResponse = await dbManager.updateEntityWhere(
                    'serviceFunctionName',
                    serviceFunctionName,
                    { lastScheduledTimestamp: new Date(), nextScheduledTimestamp: interval.next().toDate() },
                    __Backk__CronJobScheduling,
                    {
                      preHookFunc: ([{ nextScheduledTimestamp }]) =>
                        Math.abs(Date.now() - nextScheduledTimestamp.valueOf()) < 500
                    }
                  );

                  const ServiceFunctionArgType = findServiceFunctionArgumentType(
                    controller,
                    serviceFunctionName
                  );

                  const serviceFunctionArgument = ServiceFunctionArgType ? new ServiceFunctionArgType() : {};

                  return (
                    possibleErrorResponse ||
                    (await tryExecuteServiceMethod(
                      controller,
                      serviceFunctionName,
                      serviceFunctionArgument,
                      {},
                      undefined,
                      undefined,
                      false
                    ))
                  );
                });

                clsNamespace.set('globalTransaction', true);
                return !isErrorResponse(possibleErrorResponse);
              } catch (error) {
                logError(error);
                return false;
              } finally {
                dbManager.tryReleaseDbConnectionBackToPool();
                clsNamespace.set('connection', false);
              }
            });
          });
        });
      });

      cronJobs[serviceFunctionName] = job;
      job.start();
    }
  );
}
