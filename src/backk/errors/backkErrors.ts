import { HttpStatusCodes } from '../constants/constants';

export const BACKK_ERRORS_VERSION_MISMATCH = {
  errorCode: '1',
  errorMessage:
    'Entity version conflict. Entity was updated before this request, please re-fetch the entity and try update again',
  statusCode: HttpStatusCodes.CONFLICT
};

export const BACKK_ERRORS_LAST_MODIFIED_TIMESTAMP_MISMATCH = {
  errorCode: '2',
  errorMessage:
    'Entity lastModifiedTimestamp conflict. Entity was updated before this request, please re-fetch the entity and try update again',
  statusCode: HttpStatusCodes.CONFLICT
};

export const BACKK_ERRORS_DUPLICATE_ENTITY = {
  errorCode: '3',
  errorMessage: 'Duplicate entity',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_ENTITY_NOT_FOUND = {
  errorCode: '4',
  errorMessage: 'Entity not found',
  statusCode: HttpStatusCodes.NOT_FOUND
};

export const BACKK_ERRORS_INVALID_ARGUMENT = {
  errorCode: '5',
  errorMessage: 'Invalid argument: ',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_NOT_AUTHORIZED = {
  errorCode: '6',
  errorMessage: 'Service function call not authorized',
  statusCode: HttpStatusCodes.FORBIDDEN
};

export const BACKK_ERRORS_MAX_ENTITY_COUNT_REACHED = {
  errorCode: '7',
  errorMessage: 'Maximum sub-entity count reached. Cannot add new sub-entity',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_UNKNOWN_SERVICE = {
  errorCode: '8',
  errorMessage: 'Unknown service: ',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_UNKNOWN_SERVICE_FUNCTION = {
  errorCode: '9',
  errorMessage: 'Unknown function: ',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_MISSING_ARGUMENT = {
  errorCode: '10',
  errorMessage: 'Missing service function argument',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED = {
  errorCode: '11',
  errorMessage: 'Remote service function call not allowed',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_TOO_MANY_SERVICE_FUNCTIONS_CALLED = {
  errorCode: '12',
  errorMessage: 'Too many service functions called',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED_INSIDE_TRANSACTION = {
  errorCode: '13',
  errorMessage: 'Remote service function call not allowed inside transaction',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_ALLOWED_REMOTE_SERVICE_FUNCTIONS_REGEXP_PATTERN_NOT_DEFINED = {
  errorCode: '14',
  errorMessage: 'Allowed remote service functions regular expression pattern not defined',
  statusCode: HttpStatusCodes.BAD_REQUEST
};

export const BACKK_ERRORS_INVALID_HTTP_METHOD_MUST_BE_POST = {
  errorCode: '15',
  errorMessage: 'Invalid HTTP method. HTTP method must be POST',
  statusCode: HttpStatusCodes.BAD_REQUEST
};
