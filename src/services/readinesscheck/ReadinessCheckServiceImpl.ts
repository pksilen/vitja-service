import { Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { ErrorResponse } from '../../backk/Backk';
import getServiceUnavailableErrorResponse from '../../backk/getServiceUnavailableErrorResponse';
import ReadinessCheckService from '../../backk/ReadinessCheckService';

@Injectable()
export default class ReadinessCheckServiceImpl extends ReadinessCheckService {
  constructor(dbManager: AbstractDbManager) {
    super(dbManager);
  }

  async isReady(): Promise<void | ErrorResponse> {
    const isDbReady = await this.dbManager.isDbReady();
    if (isDbReady) {
      return;
    }

    return Promise.resolve(getServiceUnavailableErrorResponse('Database not ready'));
  }
}
