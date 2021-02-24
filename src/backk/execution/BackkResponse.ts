import { HttpStatusCodes } from '../constants/constants';
import { BackkError, backkErrorSymbol } from '../types/BackkError';

export default class BackkResponse {
  private statusCode: number = HttpStatusCodes.INTERNAL_SERVER_ERROR;
  private response = {};

  status(statusCode: number) {
    this.statusCode = statusCode;
  }

  send(response: object) {
    this.response = response;
  }

  getStatusCode(): number {
    return this.statusCode;
  }

  getResponse(): object {
    return this.response;
  }

  getErrorResponse(): BackkError | null {
    if (this.statusCode >= HttpStatusCodes.ERRORS_START) {
      return {
        [backkErrorSymbol]: true,
        statusCode: this.statusCode,
        errorCode: (this.response as any).errorCode,
        stackTrace: (this.response as any).stackTrace,
        message: (this.response as any).message
      };
    }

    return null;
  }
}
