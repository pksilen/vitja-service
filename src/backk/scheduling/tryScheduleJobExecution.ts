import { createNamespace } from 'cls-hooked';
import BaseService from '../service/BaseService';
// eslint-disable-next-line @typescript-eslint/camelcase
import __Backk__JobScheduling from './entities/__Backk__JobScheduling';
import { ErrorResponse } from '../types/ErrorResponse';
import { validateOrReject } from 'class-validator';
import getValidationErrors from '../validation/getValidationErrors';
import createErrorFromErrorMessageAndThrowError from '../errors/createErrorFromErrorMessageAndThrowError';
import createErrorMessageWithStatusCode from '../errors/createErrorMessageWithStatusCode';
import { HttpStatusCodes } from '../constants/constants';
import { plainToClass } from 'class-transformer';
import JobScheduling from './entities/JobScheduling';
import { scheduleCronJob } from './scheduleCronJob';
import { BACKK_ERRORS_INVALID_ARGUMENT } from '../errors/backkErrors';

export default async function tryScheduleJobExecution(
  controller: any,
  scheduledExecutionArgument: any,
  headers: { [key: string]: string },
  resp?: any
) {
  const instantiatedScheduledExecutionArgument = plainToClass(JobScheduling, scheduledExecutionArgument);

  try {
    await validateOrReject(instantiatedScheduledExecutionArgument, {
      whitelist: true,
      forbidNonWhitelisted: true
    });
  } catch (validationErrors) {
    const errorMessage =
      `Error code ${BACKK_ERRORS_INVALID_ARGUMENT.errorCode}:${BACKK_ERRORS_INVALID_ARGUMENT.errorMessage}:` +
      getValidationErrors(validationErrors);
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(errorMessage, HttpStatusCodes.BAD_REQUEST)
    );
  }

  const {
    serviceFunctionName,
    scheduledExecutionTimestamp,
    serviceFunctionArgument,
    retryIntervalsInSecs
  }: {
    serviceFunctionName: string;
    scheduledExecutionTimestamp: string;
    serviceFunctionArgument: any;
    retryIntervalsInSecs: number[];
  } = scheduledExecutionArgument;

  const [serviceName, functionName] = serviceFunctionName.split('.');

  if (!controller[serviceName]) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(`Unknown service: ${serviceName}`, HttpStatusCodes.BAD_REQUEST)
    );
  }

  const serviceFunctionResponseValueTypeName =
    controller[`${serviceName}__BackkTypes__`].functionNameToReturnTypeNameMap[functionName];

  if (!controller[serviceName][functionName] || !serviceFunctionResponseValueTypeName) {
    createErrorFromErrorMessageAndThrowError(
      createErrorMessageWithStatusCode(
        `Unknown function: ${serviceName}.${functionName}`,
        HttpStatusCodes.BAD_REQUEST
      )
    );
  }

  const retryIntervalsInSecsStr = retryIntervalsInSecs.join(',');
  const serviceFunctionArgumentStr = serviceFunctionArgument ? JSON.stringify(serviceFunctionArgument) : '';
  const scheduledExecutionTimestampAsDate = new Date(Date.parse(scheduledExecutionTimestamp));
  // TODO check that seconds are zero, because 1 min granularity only allowed
  const dbManager = (controller[serviceName] as BaseService).getDbManager();
  // eslint-disable-next-line @typescript-eslint/camelcase
  let entityOrErrorResponse: __Backk__JobScheduling | ErrorResponse | undefined;
  const clsNamespace = createNamespace('serviceFunctionExecution');
  await clsNamespace.runAndReturn(async () => {
    await dbManager.tryReserveDbConnectionFromPool();

    entityOrErrorResponse = await dbManager.createEntity(
      {
        serviceFunctionName,
        retryIntervalsInSecs: retryIntervalsInSecsStr,
        scheduledExecutionTimestamp: scheduledExecutionTimestampAsDate,
        serviceFunctionArgument: serviceFunctionArgumentStr
      },
      __Backk__JobScheduling
    );

    dbManager.tryReleaseDbConnectionBackToPool();
  });

  if (entityOrErrorResponse && 'errorMessage' in entityOrErrorResponse) {
    throw entityOrErrorResponse;
  }

  if (entityOrErrorResponse) {
    const jobId = (entityOrErrorResponse as any)._id;

    await scheduleCronJob(
      scheduledExecutionTimestampAsDate,
      retryIntervalsInSecs,
      dbManager,
      jobId,
      controller,
      serviceFunctionName,
      { ...serviceFunctionArgument, jobId }
    );

    resp?.send({
      jobId
    });
  }
}
