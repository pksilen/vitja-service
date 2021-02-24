import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../dbmanager/AbstractDbManager';
import StartupService from './StartupService';
import { BackkError } from '../../types/BackkError';
import createBackkErrorFromErrorMessageAndStatusCode from '../../errors/createBackkErrorFromErrorMessageAndStatusCode';
import initializeDatabase, { isDbInitialized } from '../../dbmanager/sql/operations/ddl/initializeDatabase';
import { HttpStatusCodes } from '../../constants/constants';
import { AllowForClusterInternalUse } from '../../decorators/service/function/AllowForClusterInternalUse';
import scheduledJobsForExecution, {
  scheduledJobsOrErrorResponse
} from '../../scheduling/scheduledJobsForExecution';
import { PromiseOfErrorOr } from '../../types/PromiseOfErrorOr';

@Injectable()
export default class StartupServiceImpl extends StartupService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  @AllowForClusterInternalUse()
  async initializeService(): PromiseOfErrorOr<null> {
    if (
      !(await isDbInitialized(this.dbManager)) &&
      !(await initializeDatabase(StartupService.controller, this.dbManager))
    ) {
      return [
        null,
        createBackkErrorFromErrorMessageAndStatusCode(
          'Service not initialized (database)',
          HttpStatusCodes.SERVICE_UNAVAILABLE
        )
      ];
    } else if (
      scheduledJobsOrErrorResponse &&
      'errorMessage' in scheduledJobsOrErrorResponse &&
      !(await scheduledJobsForExecution(StartupService.controller, this.dbManager))
    ) {
      return [
        null,
        createBackkErrorFromErrorMessageAndStatusCode(
          'Service not initialized (jobs)',
          HttpStatusCodes.SERVICE_UNAVAILABLE
        )
      ];
    }

    return [null, null];
  }
}
