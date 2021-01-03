import AbstractDbManager from "../dbmanager/AbstractDbManager";
import { CronJob } from "cron";
import findAsyncSequential from "../utils/findAsyncSequential";
import delay from "../utils/delay";
import { createNamespace } from "cls-hooked";
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__JobScheduling from "./entities/__Backk__JobScheduling";
import tryExecuteServiceMethod from "../execution/tryExecuteServiceMethod";
import { logError } from "../observability/logging/log";

const scheduledJobs: { [key: string]: CronJob } = {};

export async function scheduleCronJob(
  scheduledExecutionTimestampAsDate: Date,
  retryIntervalsInSecs: number[],
  dbManager: AbstractDbManager,
  jobId: string,
  controller: any,
  serviceFunctionName: string,
  serviceFunctionArgument: any
) {
  const job = new CronJob(scheduledExecutionTimestampAsDate, async () => {
    await findAsyncSequential([0, ...retryIntervalsInSecs], async (retryIntervalInSecs) => {
      await delay(retryIntervalInSecs * 1000);
      await dbManager.connectMongoDb();
      const clsNamespace = createNamespace('multipleServiceFunctionExecutions');
      const clsNamespace2 = createNamespace('serviceFunctionExecution');
      const response = await clsNamespace.runAndReturn(async () => {
        return await clsNamespace2.runAndReturn(async () => {
          try {
            await dbManager.tryReserveDbConnectionFromPool();
            clsNamespace.set('connection', true);
            const possibleErrorResponse = await dbManager.executeInsideTransaction(async () => {
              clsNamespace.set('globalTransaction', true);
              const possibleErrorResponse = await dbManager.deleteEntityById(jobId, __Backk__JobScheduling, {
                hookFunc: (jobScheduling: any) => jobScheduling.length !== 0
              });
              return (
                possibleErrorResponse ||
                (await tryExecuteServiceMethod(
                  controller,
                  serviceFunctionName,
                  serviceFunctionArgument ?? {},
                  {},
                  undefined,
                  undefined,
                  false
                ))
              );
            });
            clsNamespace.set('globalTransaction', true);

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
            clsNamespace.set('connection', false);
          }
        });
      });

      return response;
    });
  });

  scheduledJobs[jobId] = job;
  job.start();
}