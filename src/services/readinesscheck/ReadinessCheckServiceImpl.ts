import { HttpStatus, Injectable } from '@nestjs/common';
import AbstractDbManager from '../../backk/dbmanager/AbstractDbManager';
import { ErrorResponse } from '../../backk/Backk';
import getServiceUnavailableErrorResponse from '../../backk/getServiceUnavailableErrorResponse';

@Injectable()
export default class ReadinessCheckServiceImpl {
  constructor(private readonly abstractDbManager: AbstractDbManager) {}

  async isReady(): Promise<void | ErrorResponse> {
    const isDbReady = await this.abstractDbManager.isDbReady();
    if (isDbReady) {
      return;
    }

    return Promise.resolve(getServiceUnavailableErrorResponse('Database not ready'));
  }
}
