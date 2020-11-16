import { HttpStatusCodes } from '../constants/constants';

export default class PartialResponse {
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
}
