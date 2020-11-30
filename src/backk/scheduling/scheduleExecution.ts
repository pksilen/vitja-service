import crypto from 'crypto';
import { CronJob } from 'cron';
import tryExecuteServiceFunction from '../execution/tryExecuteServiceFunction';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
import isErrorResponse from '../errors/isErrorResponse';

export default function scheduleExecution(
  controller: any,
  scheduledExecutionArgument: any,
  headers: { [key: string]: string },
  resp?: any
) {
  const {
    serviceFunctionName,
    executionTimestampStr,
    serviceFunctionArgument,
    retryIntervalsInSecs
  }: {
    serviceFunctionName: string;
    executionTimestampStr: string;
    serviceFunctionArgument: any;
    retryIntervalsInSecs: number[];
  } = scheduledExecutionArgument;

  const executionSchedulingId = crypto
    .createHash('sha256')
    .update(serviceFunctionName + executionTimestampStr + JSON.stringify(serviceFunctionArgument))
    .digest('hex');

  const executionTimestamp = new Date(Date.parse(executionTimestampStr));

  // write to database CronJobScheduling
  // write scheduling pod id

  const job = new CronJob(executionTimestamp, async () => {
    try {
      await tryExecuteServiceFunction(controller, serviceFunctionName, serviceFunctionArgument, {});
    } catch (error) {
      findAsyncSequential(retryIntervalsInSecs, async (retryIntervalInSecs) => {
        await delay(retryIntervalInSecs * 1000);
        try {
          await tryExecuteServiceFunction(controller, serviceFunctionName, serviceFunctionArgument, {});
          return true;
        } catch (error) {
          return false;
        }
      });
    }
  });
}
