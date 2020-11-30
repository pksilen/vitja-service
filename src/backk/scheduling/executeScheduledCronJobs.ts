import { CronJob } from 'cron';
import parser from 'cron-parser';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';
import JobScheduling from '../entities/JobScheduling';
import isErrorResponse from '../errors/isErrorResponse';
import { ErrorResponse } from '../types/ErrorResponse';

const cronJobs: { [key: string]: CronJob } = {};

function createLastScheduledJobs(dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      dbManager.executeInsideTransaction(async () => {
        const entityOrErrorResponse = await dbManager.getEntityBy(
          'serviceFunctionName',
          serviceFunctionName,
          JobScheduling
        );
        if ('errorMessage' in entityOrErrorResponse && isErrorResponse(entityOrErrorResponse)) {
          const interval = parser.parseExpression(cronSchedule);
          await dbManager.createEntity(
            {
              serviceFunctionName,
              lastScheduledTimestamp: new Date(0),
              nextScheduledTimestamp: interval.next().toDate()
            },
            JobScheduling
          );
        }
      });
    }
  );
}

export default function executeScheduledCronJobs(dbManager: AbstractDbManager) {
  createLastScheduledJobs(dbManager);

  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const job = new CronJob(cronSchedule, async () => {
        const interval = parser.parseExpression(cronSchedule);
        const possibleErrorResponse = await dbManager.updateEntityBy(
          'serviceFunctionName',
          serviceFunctionName,
          { lastScheduledTimestamp: new Date(), nextScheduledTimestamp: interval.next().toDate() },
          JobScheduling,
          {
            hookFunc: ({ nextScheduledTimestamp }) =>
              Math.abs(Date.now() - nextScheduledTimestamp.valueOf()) < 500
          }
        );

        if (!possibleErrorResponse) {
          await call(
            'http://' +
              getServiceName() +
              '.' +
              getServiceNamespace() +
              '.svc.cluster.local:80/' +
              serviceFunctionName
          );
        }
      });
      cronJobs[serviceFunctionName] = job;
      job.start();
    }
  );
}
