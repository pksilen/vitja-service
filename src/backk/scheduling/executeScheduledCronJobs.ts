import { CronJob } from 'cron';
import parser from 'cron-parser';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
import CronJobScheduling from './entities/CronJobScheduling';
import isErrorResponse from '../errors/isErrorResponse';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';

const cronJobs: { [key: string]: CronJob } = {};

function createLastScheduledJobs(dbManager: AbstractDbManager) {
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

export default function executeScheduledCronJobs(dbManager: AbstractDbManager) {
  createLastScheduledJobs(dbManager);

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
            CronJobScheduling,
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
