import { CronJob } from "cron";
import parser from "cron-parser";
import AbstractDbManager from "../dbmanager/AbstractDbManager";
import serviceFunctionAnnotationContainer
  from "../decorators/service/function/serviceFunctionAnnotationContainer";
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__CronJobScheduling from "./entities/__Backk__CronJobScheduling";
import findAsyncSequential from "../utils/findAsyncSequential";
import delay from "../utils/delay";
import { createNamespace } from "cls-hooked";
import { logError } from "../observability/logging/log";
import tryExecuteServiceMethod from "../execution/tryExecuteServiceMethod";
import findServiceFunctionArgumentType from "../metadata/findServiceFunctionArgumentType";
import BackkResponse from "../execution/BackkResponse";
import { Values } from "../constants/constants";

const cronJobs: { [key: string]: CronJob } = {};

export default function scheduleCronJobsForExecution(controller: any, dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const job = new CronJob(cronSchedule, async () => {
        const retryIntervalsInSecs = serviceFunctionAnnotationContainer.getServiceFunctionNameToRetryIntervalsInSecsMap()[
          serviceFunctionName
        ];
        const interval = parser.parseExpression(cronSchedule);
        await findAsyncSequential([0, ...retryIntervalsInSecs], async (retryIntervalInSecs) => {
          await delay(retryIntervalInSecs * 1000);
          const clsNamespace = createNamespace('multipleServiceFunctionExecutions');
          const clsNamespace2 = createNamespace('serviceFunctionExecution');
          return clsNamespace.runAndReturn(async () => {
            return clsNamespace2.runAndReturn(async () => {
              try {
                await dbManager.tryReserveDbConnectionFromPool();
                clsNamespace.set('connection', true);

                const [, error] = await dbManager.executeInsideTransaction(async () => {
                  clsNamespace.set('globalTransaction', true);

                  const [, error] = await dbManager.updateEntityWhere(
                    'serviceFunctionName',
                    serviceFunctionName,
                    { lastScheduledTimestamp: new Date(), nextScheduledTimestamp: interval.next().toDate() },
                    __Backk__CronJobScheduling,
                    {
                      isSuccessfulOrTrue: ({ nextScheduledTimestamp }) =>
                        Math.abs(Date.now() - nextScheduledTimestamp.valueOf()) < Values._500
                    }
                  );

                  const ServiceFunctionArgType = findServiceFunctionArgumentType(
                    controller,
                    serviceFunctionName
                  );

                  const serviceFunctionArgument = ServiceFunctionArgType ? new ServiceFunctionArgType() : {};

                  if (error) {
                    return [null, error];
                  }

                  const response = new BackkResponse();

                  await tryExecuteServiceMethod(
                    controller,
                    serviceFunctionName,
                    serviceFunctionArgument,
                    {},
                    response,
                    undefined,
                    false
                  );

                  return [null, response.getErrorResponse()];
                });

                clsNamespace.set('globalTransaction', true);
                return !error;
              } catch (error) {
                logError(error);
                return false;
              } finally {
                dbManager.tryReleaseDbConnectionBackToPool();
                clsNamespace.set('connection', false);
              }
            });
          });
        });
      });

      cronJobs[serviceFunctionName] = job;
      job.start();
    }
  );
}
