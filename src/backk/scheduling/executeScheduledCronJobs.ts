import { CronJob } from 'cron';
import parser from 'cron-parser';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
import __Backk__CronJobScheduling from './entities/__Backk__CronJobScheduling';
import isErrorResponse from '../errors/isErrorResponse';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';

const cronJobs: { [key: string]: CronJob } = {};

export default function executeScheduledCronJobs(dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const job = new CronJob(cronSchedule, async () => {
        const interval = parser.parseExpression(cronSchedule);
        let possibleErrorResponse;
        const clsNamespace = createNamespace('serviceFunctionExecution');
        clsNamespace.run(async () => {
          await dbManager.tryReserveDbConnectionFromPool();
          possibleErrorResponse = await dbManager.updateEntityBy(
            'serviceFunctionName',
            serviceFunctionName,
            { lastScheduledTimestamp: new Date(), nextScheduledTimestamp: interval.next().toDate() },
            __Backk__CronJobScheduling,
            {
              hookFunc: ({ nextScheduledTimestamp }) =>
                Math.abs(Date.now() - nextScheduledTimestamp.valueOf()) < 500
            }
          );
          dbManager.tryReleaseDbConnectionBackToPool();
        });

        if (!possibleErrorResponse) {
          const possibleErrorResponse = await call(
            'http://' +
              getServiceName() +
              '.' +
              getServiceNamespace() +
              '.svc.cluster.local:80/' +
              serviceFunctionName
          );

          if (isErrorResponse(possibleErrorResponse)) {
            const retryIntervalsInSecs = serviceFunctionAnnotationContainer.getServiceFunctionNameToRetryIntervalsInSecsMap()[
              serviceFunctionName
            ];

            findAsyncSequential(retryIntervalsInSecs, async (retryIntervalInSecs) => {
              await delay(retryIntervalInSecs * 1000);
              const possibleErrorResponse = await call(
                'http://' +
                  getServiceName() +
                  '.' +
                  getServiceNamespace() +
                  '.svc.cluster.local:80/' +
                  serviceFunctionName
              );
              return !isErrorResponse(possibleErrorResponse);
            });
          }
        }
      });

      cronJobs[serviceFunctionName] = job;
      job.start();
    }
  );
}
