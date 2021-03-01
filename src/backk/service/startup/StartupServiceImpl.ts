import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../dbmanager/AbstractDbManager';
import StartupService from './StartupService';
import createBackkErrorFromErrorMessageAndStatusCode from '../../errors/createBackkErrorFromErrorMessageAndStatusCode';
import initializeDatabase, { isDbInitialized } from '../../dbmanager/sql/operations/ddl/initializeDatabase';
import { HttpStatusCodes } from '../../constants/constants';
import { AllowForClusterInternalUse } from '../../decorators/service/function/AllowForClusterInternalUse';
import scheduleJobsForExecution, { scheduledJobs } from '../../scheduling/scheduleJobsForExecution';
import { PromiseOfErrorOr } from '../../types/PromiseOfErrorOr';

@Injectable()
export default class StartupServiceImpl extends StartupService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  // noinspection FunctionWithMoreThanThreeNegationsJS
  @AllowForClusterInternalUse()
  async startupService(): PromiseOfErrorOr<null> {
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
      !scheduledJobs &&
      !(await scheduleJobsForExecution(StartupService.controller, this.dbManager))
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
