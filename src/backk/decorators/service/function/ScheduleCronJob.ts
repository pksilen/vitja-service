import serviceFunctionAnnotationContainer from "./serviceFunctionAnnotationContainer";

export function ScheduleCronJob(cronSchedule: string) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    serviceFunctionAnnotationContainer.addCronScheduleForServiceFunction(
      object.constructor,
      functionName,
      cronSchedule
    );
  };
}
