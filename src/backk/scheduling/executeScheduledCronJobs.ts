import { CronJob } from 'cron';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import serviceFunctionAnnotationContainer from '../decorators/service/function/serviceFunctionAnnotationContainer';
import call from '../remote/http/call';
import getServiceName from '../utils/getServiceName';
import getServiceNamespace from '../utils/getServiceNamespace';

const cronJobs: { [key: string]: CronJob } = {};

export default function executeScheduledCronJobs(dbManager: AbstractDbManager) {
  Object.entries(serviceFunctionAnnotationContainer.getServiceFunctionNameToCronScheduleMap()).forEach(
    ([serviceFunctionName, cronSchedule]) => {
      const job = new CronJob(cronSchedule, () => {
        call(
          'http://' +
            getServiceName() +
            '.' +
            getServiceNamespace() +
            '.svc.cluster.local:80/' +
            serviceFunctionName
        );
      });
      cronJobs[serviceFunctionName] = job;
      job.start();
    }
  );
}
