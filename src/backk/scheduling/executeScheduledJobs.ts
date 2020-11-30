import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import { CronJob } from 'cron';
import { createNamespace } from 'cls-hooked';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
import isErrorResponse from '../errors/isErrorResponse';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import JobScheduling from './entities/JobScheduling';
import { ErrorResponse } from '../types/ErrorResponse';

const cronJobs: { [key: string]: CronJob } = {};

export default async function executeScheduledJobs(dbManager: AbstractDbManager) {
  const clsNamespace = createNamespace('serviceFunctionExecution');
  let jobSchedulingsOrErrorResponse: JobScheduling[] | ErrorResponse | undefined;
  await clsNamespace.runAndReturn(async () => {
    await dbManager.tryReserveDbConnectionFromPool();
    jobSchedulingsOrErrorResponse = await dbManager.getAllEntities(JobScheduling);
    dbManager.tryReleaseDbConnectionBackToPool();
  });

  if (!jobSchedulingsOrErrorResponse || 'errorMessage' in jobSchedulingsOrErrorResponse) {
    return;
  }

  jobSchedulingsOrErrorResponse.forEach(
    ({
      _id,
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
          possibleErrorResponse = await dbManager.deleteEntityById(_id, JobScheduling, {
            hookFunc: (entity) => entity !== undefined
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
            JSON.parse(serviceFunctionArgument)
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
                JSON.parse(serviceFunctionArgument)
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