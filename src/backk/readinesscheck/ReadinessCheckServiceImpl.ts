import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../dbmanager/AbstractDbManager';
import ReadinessCheckService from './ReadinessCheckService';
import { ErrorResponse } from '../types/ErrorResponse';
import createErrorResponseFromErrorMessageAndStatusCode from '../errors/createErrorResponseFromErrorMessageAndStatusCode';
import initializeDatabase, { isDbInitialized } from '../dbmanager/sql/operations/ddl/initializeDatabase';
import { HttpStatusCodes } from '../constants/constants';
import { AllowForClusterInternalUse } from '../decorators/service/function/AllowForClusterInternalUse';
import scheduledJobsForExecution, {
  scheduledJobsOrErrorResponse
} from '../scheduling/scheduledJobsForExecution';

@Injectable()
export default class ReadinessCheckServiceImpl extends ReadinessCheckService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForClusterInternalUse()
  async isReady(): Promise<void | ErrorResponse> {
    if (
      !(await isDbInitialized(this.dbManager)) &&
      !(await initializeDatabase(ReadinessCheckService.controller, this.dbManager))
    ) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Database not ready',
        HttpStatusCodes.SERVICE_UNAVAILABLE
      );
    } else if (
      scheduledJobsOrErrorResponse &&
      'errorMessage' in scheduledJobsOrErrorResponse &&
      !(await scheduledJobsForExecution(ReadinessCheckService.controller, this.dbManager))
    ) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Database not ready',
        HttpStatusCodes.SERVICE_UNAVAILABLE
      );
    }

    return;
  }
}
