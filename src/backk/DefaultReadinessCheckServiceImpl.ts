import { HttpStatus, Injectable } from '@nestjs/common';
import AbstractDbManager from './dbmanager/AbstractDbManager';
import { ErrorResponse } from './Backk';

@Injectable()
export default class DefaultReadinessCheckServiceImpl {
  constructor(private readonly abstractDbManager: AbstractDbManager) {}

  async isReady(): Promise<void | ErrorResponse> {
    const isDbReady = await this.abstractDbManager.isDbReady();
    if (isDbReady) {
      return;
    }

    return Promise.resolve({ statusCode: HttpStatus.SERVICE_UNAVAILABLE, errorMessage: 'Service not ready' });
  }
}
