import { ErrorResponse } from '../../backk/Backk';
import ReadinessCheckService from './ReadinessCheckService';
import { HttpStatus } from '@nestjs/common';

export default class ReadinessCheckServiceImpl extends ReadinessCheckService {
  isReady(): Promise<void | ErrorResponse> {
    if (process.env.NODE_ENV === 'development') {
      return Promise.resolve();
    }

    return Promise.resolve({ statusCode: HttpStatus.SERVICE_UNAVAILABLE, errorMessage: 'Service not ready' });
  }
}
