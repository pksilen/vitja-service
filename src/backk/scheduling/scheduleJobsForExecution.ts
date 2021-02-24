/* eslint-disable @typescript-eslint/camelcase */
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import { createNamespace } from "cls-hooked";
import findAsyncSequential from "../utils/findAsyncSequential";
import delay from "../utils/delay";
import __Backk__JobScheduling from "./entities/__Backk__JobScheduling";
import { logError } from "../observability/logging/log";
import forEachAsyncParallel from "../utils/forEachAsyncParallel";
import { scheduleCronJob } from "./scheduleCronJob";

export let scheduledJobs: __Backk__JobScheduling[] | null = null;

export default async function scheduleJobsForExecution(
  controller: any | undefined,
  dbManager: AbstractDbManager
) {
  if (!controller) {
    return false;
  }

  await findAsyncSequential([0, 1, 2, 5, 10, 30, 60, 120, 300, 600], async (retryDelayInSecs) => {
    await delay(retryDelayInSecs * 1000);
    const clsNamespace = createNamespace('serviceFunctionExecution');

    await clsNamespace.runAndReturn(async () => {
      try {
        await dbManager.tryReserveDbConnectionFromPool();
        [scheduledJobs] = await dbManager.getAllEntities(__Backk__JobScheduling);
        dbManager.tryReleaseDbConnectionBackToPool();
      } catch (error) {
        // No operation
      }
    });

    return !!scheduledJobs;
  });

  if (!scheduledJobs) {
    logError(new Error('Unable to load scheduled jobs from database'));
    return false;
  }

  await forEachAsyncParallel(
    scheduledJobs,
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
