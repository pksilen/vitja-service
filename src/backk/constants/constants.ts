export const MAX_INT_VALUE = 2147483647;

export class HttpStatusCodes {
  static readonly SUCCESS = 200;
  static readonly ERRORS_START = 300;
  static readonly NOT_MODIFIED = 304;
  static readonly CLIENT_ERRORS_START = 400;
  static readonly BAD_REQUEST = 400;
  static readonly FORBIDDEN = 403;
  static readonly NOT_FOUND = 404;
  static readonly INTERNAL_ERRORS_START = 500;
  static readonly INTERNAL_SERVER_ERROR = 500;
  static readonly SERVICE_UNAVAILABLE = 503;
}

