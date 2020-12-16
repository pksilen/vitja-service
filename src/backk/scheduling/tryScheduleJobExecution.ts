import { CronJob } from 'cron';
import tryExecuteServiceMethod from '../execution/tryExecuteServiceMethod';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';
import BaseService from '../service/BaseService';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__JobScheduling from './entities/__Backk__JobScheduling';
import { ErrorResponse } from '../types/ErrorResponse';
import { logError } from '../observability/logging/log';
import AbstractDbManager from "../dbmanager/AbstractDbManager";

const scheduledJobs: { [key: string]: CronJob } = {};

export async function scheduleCronJob(
  scheduledExecutionTimestampAsDate: Date,
  retryIntervalsInSecs: number[],
  dbManager: AbstractDbManager,
  jobId: string,
  controller: any,
  serviceFunctionName: string,
  serviceFunctionArgument: any,
) {
  const job = new CronJob(scheduledExecutionTimestampAsDate, async () => {
    await findAsyncSequential([0, ...retryIntervalsInSecs], async (retryIntervalInSecs) => {
      await delay(retryIntervalInSecs * 1000);
      const clsNamespace = createNamespace('serviceFunctionExecution');
      return await clsNamespace.runAndReturn(async () => {
        try {
          await dbManager.tryReserveDbConnectionFromPool();
          const possibleErrorResponse = await dbManager.executeInsideTransaction(async () => {
            const possibleErrorResponse = await dbManager.deleteEntityById(
              jobId,
              __Backk__JobScheduling,
              {
                hookFunc: (jobScheduling: any) => jobScheduling.length !== 0
              }
            );
            return (
              possibleErrorResponse ||
              (await tryExecuteServiceMethod(
                controller,
                serviceFunctionName,
                serviceFunctionArgument ?? {},
                {  },
                undefined,
                undefined,
                false
              ))
            );
          });
          if (possibleErrorResponse) {
            return false;
          } else {
            delete scheduledJobs[jobId];
            return true;
          }
        } catch (error) {
          logError(error);
          return false;
        } finally {
          dbManager.tryReleaseDbConnectionBackToPool();
        }
      });
    });
  });

  scheduledJobs[jobId] = job;
  job.start();
}

export default async function tryScheduleJobExecution(
  controller: any,
  scheduledExecutionArgument: any,
  headers: { [key: string]: string },
  resp?: any
) {
  const {
    serviceFunctionName,
    scheduledExecutionTimestamp,
    serviceFunctionArgument,
    retryIntervalsInSecs
  }: {
    serviceFunctionName: string;
    scheduledExecutionTimestamp: string;
    serviceFunctionArgument: any;
    retryIntervalsInSecs: number[];
  } = scheduledExecutionArgument;

  const retryIntervalsInSecsStr = retryIntervalsInSecs.join(',');
  const serviceFunctionArgumentStr = serviceFunctionArgument ? JSON.stringify(serviceFunctionArgument): '';
  const scheduledExecutionTimestampAsDate = new Date(Date.parse(scheduledExecutionTimestamp));
  // TODO check that seconds are zero, because 1 min granularity only allowed
  const [serviceName] = serviceFunctionName.split('.');
  const dbManager = (controller[serviceName] as BaseService).getDbManager();
  // eslint-disable-next-line @typescript-eslint/camelcase
  let entityOrErrorResponse: __Backk__JobScheduling | ErrorResponse | undefined;
  const clsNamespace = createNamespace('serviceFunctionExecution');
  await clsNamespace.runAndReturn(async () => {
    await dbManager.tryReserveDbConnectionFromPool();
    entityOrErrorResponse = await dbManager.createEntity(
      {
        serviceFunctionName,
        retryIntervalsInSecs: retryIntervalsInSecsStr,
        scheduledExecutionTimestamp: scheduledExecutionTimestampAsDate,
        serviceFunctionArgument: serviceFunctionArgumentStr
      },
      __Backk__JobScheduling
    );
    dbManager.tryReleaseDbConnectionBackToPool();
  });

  if (entityOrErrorResponse && 'errorMessage' in entityOrErrorResponse) {
    throw entityOrErrorResponse;
  }

  if (entityOrErrorResponse) {
    await scheduleCronJob(
      scheduledExecutionTimestampAsDate,
      retryIntervalsInSecs,
      dbManager,
      (entityOrErrorResponse as any)._id,
      controller,
      serviceFunctionName,
      serviceFunctionArgument
    );

    resp?.send({
      _id: (entityOrErrorResponse as any)._id
    });
  }
}
