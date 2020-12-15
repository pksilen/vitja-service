import serviceFunctionAnnotationContainer from './serviceFunctionAnnotationContainer';

export type Range = {
  start: number;
  end: number;
};

export type CronSchedule = {
  seconds?: number | number[] | Range;
  secondInterval?: number;
  minutes?: number | number[] | Range;
  minuteInterval?: number;
  hours?: number | number[] | Range;
  hourInterval?: number;
  daysOfMonth?: number | number[] | Range;
  dayInterval?: number;

  // 0 - 11
  months?: number | number[] | Range;
  monthInterval?: number;

  // 0-6 (Sun-Sat)
  daysOfWeek?: number | number[] | Range;
  weekDayInterval?: number;
};

function getCronValuesStr(values: number | number[] | Range | undefined): string {
  if (values === undefined) {
    return '*';
  }

  if (typeof values === 'number') {
    return values.toString();
  }

  if (Array.isArray(values)) {
    return values.map((value) => value.toString()).join(',');
  }

  return values.start + '-' + values.end;
}

function getCronIntervalStr(interval: number | undefined): string {
  if (interval === undefined) {
    return '';
  }

  return '/' + interval;
}

export function CronJob(cronSchedule: CronSchedule, retryIntervalsInSecs: number[]) {
  const cronScheduleStr = Array(6)
    .fill('')
    .map((defaultCronParameter, index) => {
      // noinspection IfStatementWithTooManyBranchesJS
      if (index === 0) {
        return getCronValuesStr(cronSchedule.seconds) + getCronIntervalStr(cronSchedule.secondInterval);
      } else if (index === 1) {
        return getCronValuesStr(cronSchedule.minutes) + getCronIntervalStr(cronSchedule.minuteInterval);
      } else if (index === 2) {
        return getCronValuesStr(cronSchedule.hours) + getCronIntervalStr(cronSchedule.hourInterval);
      } else if (index === 3) {
        return getCronValuesStr(cronSchedule.daysOfMonth) + getCronIntervalStr(cronSchedule.dayInterval);
      } else if (index === 4) {
        return getCronValuesStr(cronSchedule.months) + getCronIntervalStr(cronSchedule.monthInterval);
      } else if (index === 5) {
        return getCronValuesStr(cronSchedule.daysOfWeek) + getCronIntervalStr(cronSchedule.weekDayInterval);
      }

      return defaultCronParameter;
    })
    .join(' ');

  // eslint-disable-next-line @typescript-eslint/ban-types
  return function(object: Object, functionName: string) {
    const superClassPrototype = Object.getPrototypeOf(object);
    console.log(superClassPrototype.constructor.name);
    serviceFunctionAnnotationContainer.addCronScheduleForServiceFunction(
      superClassPrototype.constructor,
      functionName,
      cronScheduleStr
    );

    serviceFunctionAnnotationContainer.addRetryIntervalsInSecsForServiceFunction(
      superClassPrototype.constructor,
      functionName,
      retryIntervalsInSecs
    );

    serviceFunctionAnnotationContainer.addServiceFunctionAllowedForClusterInternalUse(
      object.constructor,
      functionName
    );
  };
}
