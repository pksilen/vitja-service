/* eslint-disable @typescript-eslint/camelcase */
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import { createNamespace } from 'cls-hooked';
import findAsyncSequential from '../utils/findAsyncSequential';
import delay from '../utils/delay';
import __Backk__JobScheduling from './entities/__Backk__JobScheduling';
import { ErrorResponse } from '../types/ErrorResponse';
import { logError } from '../observability/logging/log';
import forEachAsyncParallel from '../utils/forEachAsyncParallel';
import { scheduleCronJob } from "./scheduleCronJob";

export let scheduledJobsOrErrorResponse: __Backk__JobScheduling[] | ErrorResponse | undefined;

export default async function scheduledJobsForExecution(controller: any | undefined, dbManager: AbstractDbManager) {
  if (!controller) {
    return false;
  }

  await findAsyncSequential([0, 1, 2, 5, 10, 30, 60, 120, 300, 600], async (retryDelayInSecs) => {
    await delay(retryDelayInSecs * 1000);
    const clsNamespace = createNamespace('serviceFunctionExecution');
    await clsNamespace.runAndReturn(async () => {
      await dbManager.tryReserveDbConnectionFromPool();
      scheduledJobsOrErrorResponse = await dbManager.getAllEntities(__Backk__JobScheduling);
      dbManager.tryReleaseDbConnectionBackToPool();
    });

    return !(!scheduledJobsOrErrorResponse || 'errorMessage' in scheduledJobsOrErrorResponse);
  });

  if (!scheduledJobsOrErrorResponse || 'errorMessage' in scheduledJobsOrErrorResponse) {
    logError(new Error('Unable to load scheduled jobs from database'));
    return false;
  }

  await forEachAsyncParallel(
    scheduledJobsOrErrorResponse,
    async ({
      _id,
      retryIntervalsInSecs,
      scheduledExecutionTimestamp,
      serviceFunctionName,
      serviceFunctionArgument
    }) => {
      await scheduleCronJob(
        scheduledExecutionTimestamp,
        retryIntervalsInSecs.split(',').map((retryIntervalInSecs) => parseInt(retryIntervalInSecs, 10)),
        dbManager,
        _id,
        controller,
        serviceFunctionName,
        serviceFunctionArgument ? JSON.parse(serviceFunctionArgument) : undefined
      );
    }
  );

  return true;
}
