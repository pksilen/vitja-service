import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export function ScheduleCronJob(cronSchedule: string, retryIntervalsInSecs: number[]) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addCronScheduleForServiceFunction(
      object.constructor,
      functionName,
      cronSchedule
    );

    serviceFunctionAnnotationContainer.addRetryIntervalsInSecsForServiceFunction(
      object.constructor,
      functionName,
      retryIntervalsInSecs
    );

    serviceFunctionAnnotationContainer.addServiceFunctionAllowedForInternalUse(
      object.constructor,
      functionName
    );
  };
}
