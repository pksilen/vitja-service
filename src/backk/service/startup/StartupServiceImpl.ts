import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../dbmanager/AbstractDbManager';
import StartupService from './StartupService';
import { BackkError } from '../../types/BackkError';
import createErrorResponseFromErrorMessageAndStatusCode from '../../errors/createErrorResponseFromErrorMessageAndStatusCode';
import initializeDatabase, { isDbInitialized } from '../../dbmanager/sql/operations/ddl/initializeDatabase';
import { HttpStatusCodes } from '../../constants/constants';
import { AllowForClusterInternalUse } from '../../decorators/service/function/AllowForClusterInternalUse';
import scheduledJobsForExecution, {
  scheduledJobsOrErrorResponse
} from '../../scheduling/scheduledJobsForExecution';

@Injectable()
export default class StartupServiceImpl extends StartupService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForClusterInternalUse()
  async initializeService(): Promise<BackkError | null> {
    if (
      !(await isDbInitialized(this.dbManager)) &&
      !(await initializeDatabase(StartupService.controller, this.dbManager))
    ) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Service not initialized (database)',
        HttpStatusCodes.SERVICE_UNAVAILABLE
      );
    } else if (
      scheduledJobsOrErrorResponse &&
      'errorMessage' in scheduledJobsOrErrorResponse &&
      !(await scheduledJobsForExecution(StartupService.controller, this.dbManager))
    ) {
      return createErrorResponseFromErrorMessageAndStatusCode(
        'Service not initialized (jobs)',
        HttpStatusCodes.SERVICE_UNAVAILABLE
      );
    }

    return;
  }
}
