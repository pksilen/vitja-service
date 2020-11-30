import crypto from 'crypto';
import { CronJob } from 'cron';
import tryExecuteServiceFunction from '../execution/tryExecuteServiceFunction';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import { createNamespace } from 'cls-hooked';
import BaseService from '../service/BaseService';
import JobScheduling from '../entities/JobScheduling';

const scheduledJobs: { [key: string]: CronJob } = {};

export default function scheduleExecution(
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

  const [serviceName] = serviceFunctionName.split('.');
  const dbManager = (controller[serviceName] as BaseService).getDbManager();
  const clsNamespace = createNamespace('serviceFunctionExecution');
  clsNamespace.run(async () => {
    await dbManager.tryReserveDbConnectionFromPool();
    await dbManager.createEntity(
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
  });

  const job = new CronJob(scheduledExecutionTimestampAsDate, async () => {
    try {
      await tryExecuteServiceFunction(controller, serviceFunctionName, serviceFunctionArgument, headers);
      delete scheduledJobs[executionSchedulingId];
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
      delete scheduledJobs[executionSchedulingId];
    }
  });

  scheduledJobs[executionSchedulingId] = job;
  job.start();

  resp?.send({
    executionSchedulingId
  });
}
