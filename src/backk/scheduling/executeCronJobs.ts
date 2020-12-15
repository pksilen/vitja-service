import { CronJob } from 'cron';
import parser from 'cron-parser';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';
import { logError } from '../observability/logging/log';
import isErrorResponse from "../errors/isErrorResponse";

const cronJobs: { [key: string]: CronJob } = {};

export default function executeCronJobs(dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const job = new CronJob(cronSchedule, async () => {
        const retryIntervalsInSecs = serviceFunctionAnnotationContainer.getServiceFunctionNameToRetryIntervalsInSecsMap()[
          serviceFunctionName
        ];

        const interval = parser.parseExpression(cronSchedule);
        const clsNamespace = createNamespace('serviceFunctionExecution');
        await clsNamespace.runAndReturn(async () => {
          await findAsyncSequential([0, ...retryIntervalsInSecs], async (retryIntervalInSecs) => {
            await delay(retryIntervalInSecs * 1000);

            try {
              await dbManager.tryReserveDbConnectionFromPool();
              const possibleErrorResponse = await dbManager.executeInsideTransaction(async () => {
                const possibleErrorResponse = await dbManager.updateEntityWhere(
                  'serviceFunctionName',
                  serviceFunctionName,
                  { lastScheduledTimestamp: new Date(), nextScheduledTimestamp: interval.next().toDate() },
                  __Backk__CronJobScheduling,
                  {
                    hookFunc: ([{ nextScheduledTimestamp }]) =>
                      Math.abs(Date.now() - nextScheduledTimestamp.valueOf()) < 500
                  }
                );

                if (possibleErrorResponse) {
                  return false;
                }

                const serviceUrl =
                  process.env.SERVICE_URL ??
                  'http://' + getServiceName() + '.' + getServiceNamespace() + '.svc.cluster.local:80/';

                const response = await call(serviceUrl + '/' + serviceFunctionName);
                console.log(response)
                return response
              });

              return !isErrorResponse(possibleErrorResponse);
            } catch (error) {
              logError(error);
              return false;
            } finally {
              dbManager.tryReleaseDbConnectionBackToPool();
            }
          });
        });
      });

      cronJobs[serviceFunctionName] = job;
      job.start();
    }
  );
}
