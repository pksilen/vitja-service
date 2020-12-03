import AbstractDbManager from '../dbmanager/AbstractDbManager';
import { CronJob } from 'cron';
import { createNamespace } from 'cls-hooked';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
import isErrorResponse from '../errors/isErrorResponse';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import __Backk__JobScheduling from './entities/__Backk__JobScheduling';
import { ErrorResponse } from '../types/ErrorResponse';

const cronJobs: { [key: string]: CronJob } = {};

export default async function executeScheduledJobs(dbManager: AbstractDbManager) {
  const clsNamespace = createNamespace('serviceFunctionExecution');
  let jobSchedulingsOrErrorResponse: __Backk__JobScheduling[] | ErrorResponse | undefined;
  await clsNamespace.runAndReturn(async () => {
    await dbManager.tryReserveDbConnectionFromPool();
    jobSchedulingsOrErrorResponse = await dbManager.getAllEntities(__Backk__JobScheduling);
    dbManager.tryReleaseDbConnectionBackToPool();
  });

  if (!jobSchedulingsOrErrorResponse || 'errorMessage' in jobSchedulingsOrErrorResponse) {
    return;
  }

  jobSchedulingsOrErrorResponse.forEach(
    ({
      _id,
      executionSchedulingId,
      retryIntervalsInSecs,
      scheduledExecutionTimestamp,
      serviceFunctionName,
      serviceFunctionArgument
    }) => {
      const job = new CronJob(scheduledExecutionTimestamp, async () => {
        const clsNamespace = createNamespace('serviceFunctionExecution');
        let possibleErrorResponse;
        clsNamespace.run(async () => {
          await dbManager.tryReserveDbConnectionFromPool();
          possibleErrorResponse = await dbManager.deleteEntityById(_id, __Backk__JobScheduling, {
            hookFunc: (jobScheduling) => jobScheduling !== undefined
          });
          dbManager.tryReleaseDbConnectionBackToPool();
        });

        if (!possibleErrorResponse) {
          const possibleErrorResponse = await call(
            'http://' +
              getServiceName() +
              '.' +
              getServiceNamespace() +
              '.svc.cluster.local:80/' +
              serviceFunctionName,
            { ...JSON.parse(serviceFunctionArgument), executionSchedulingId }
          );

          if (isErrorResponse(possibleErrorResponse)) {
            const retryIntervalsInSecsArray = retryIntervalsInSecs.split(',');
            findAsyncSequential(retryIntervalsInSecsArray, async (retryIntervalInSecs) => {
              await delay(parseInt(retryIntervalInSecs, 10) * 1000);
              const possibleErrorResponse = await call(
                'http://' +
                  getServiceName() +
                  '.' +
                  getServiceNamespace() +
                  '.svc.cluster.local:80/' +
                  serviceFunctionName,
                { ...JSON.parse(serviceFunctionArgument), executionSchedulingId }
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
