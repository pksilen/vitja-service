import crypto from 'crypto';
import { CronJob } from 'cron';
import tryExecuteServiceFunction from '../execution/tryExecuteServiceFunction';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';
import BaseService from '../service/BaseService';
import JobScheduling from './entities/JobScheduling';
import { ErrorResponse } from '../types/ErrorResponse';
import AbstractDbManager from '../dbmanager/AbstractDbManager';

const scheduledJobs: { [key: string]: CronJob } = {};

function removeScheduledJob(dbManager: AbstractDbManager, executionSchedulingId: string, _id: string) {
  delete scheduledJobs[executionSchedulingId];

  const clsNamespace = createNamespace('serviceFunctionExecution');
  clsNamespace.run(async () => {
    await dbManager.tryReserveDbConnectionFromPool();
    await dbManager.deleteEntityById(_id, JobScheduling);
    dbManager.tryReleaseDbConnectionBackToPool();
  });
}

export default function scheduleJobExecution(
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

  const serviceFunctionArgumentStr = JSON.stringify(serviceFunctionArgument);
  const executionSchedulingId = crypto
    .createHash('sha256')
    .update(serviceFunctionName + scheduledExecutionTimestamp + serviceFunctionArgumentStr)
    .digest('hex');

  const scheduledExecutionTimestampAsDate = new Date(Date.parse(scheduledExecutionTimestamp));
  // TODO check that seconds are zero, because 1 min granularity only allowed

  const [serviceName] = serviceFunctionName.split('.');
  const dbManager = (controller[serviceName] as BaseService).getDbManager();
  const clsNamespace = createNamespace('serviceFunctionExecution');
  let entityOrErrorResponse: JobScheduling | ErrorResponse;
  clsNamespace.run(async () => {
    await dbManager.tryReserveDbConnectionFromPool();
    entityOrErrorResponse = await dbManager.createEntity(
      {
        executionSchedulingId,
        serviceFunctionName,
        retryIntervalsInSecs: retryIntervalsInSecsStr,
        scheduledExecutionTimestamp: scheduledExecutionTimestampAsDate,
        schedulingServiceInstanceId: process.env.SERVICE_INSTANCE_ID ?? '',
        serviceFunctionArgument: serviceFunctionArgumentStr
      },
      JobScheduling
    );
    dbManager.tryReleaseDbConnectionBackToPool();

    if ('errorMessage' in entityOrErrorResponse) {
      throw entityOrErrorResponse;
    }
  });

  const job = new CronJob(scheduledExecutionTimestampAsDate, async () => {
    try {
      await tryExecuteServiceFunction(controller, serviceFunctionName, serviceFunctionArgument, headers);
      removeScheduledJob(dbManager, executionSchedulingId, (entityOrErrorResponse as JobScheduling)._id);
    } catch (error) {
      await findAsyncSequential(retryIntervalsInSecs, async (retryIntervalInSecs) => {
        await delay(retryIntervalInSecs * 1000);
        try {
          await tryExecuteServiceFunction(controller, serviceFunctionName, serviceFunctionArgument, headers);
          return true;
        } catch (error) {
          return false;
        }
      });
      removeScheduledJob(dbManager, executionSchedulingId, (entityOrErrorResponse as JobScheduling)._id);
    }
  });

  scheduledJobs[executionSchedulingId] = job;
  job.start();

  resp?.send({
    executionSchedulingId
  });
}
