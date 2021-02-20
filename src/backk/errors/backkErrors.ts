import { HttpStatusCodes } from '../constants/constants';

export const BACKK_ERRORS = {
  ENTITY_VERSION_MISMATCH: {
    errorCode: '1',
    errorMessage:
      'BackkEntity version conflict. BackkEntity was updated before this request, please re-fetch the entity and try update again',
    statusCode: HttpStatusCodes.CONFLICT
  },
  ENTITY_LAST_MODIFIED_TIMESTAMP_MISMATCH: {
    errorCode: '2',
    errorMessage:
      'BackkEntity lastModifiedTimestamp conflict. BackkEntity was updated before this request, please re-fetch the entity and try update again',
    statusCode: HttpStatusCodes.CONFLICT
  },
  DUPLICATE_ENTITY: {
    errorCode: '3',
    errorMessage: 'Duplicate entity',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  ENTITY_NOT_FOUND: {
    errorCode: '4',
    errorMessage: 'BackkEntity not found',
    statusCode: HttpStatusCodes.NOT_FOUND
  },
  INVALID_ARGUMENT: {
    errorCode: '5',
    errorMessage: 'Invalid argument: ',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  SERVICE_FUNCTION_CALL_NOT_AUTHORIZED: {
    errorCode: '6',
    errorMessage: 'Service function call not authorized',
    statusCode: HttpStatusCodes.FORBIDDEN
  },
  MAX_ENTITY_COUNT_REACHED: {
    errorCode: '7',
    errorMessage: 'Maximum sub-entity count reached. Cannot add new sub-entity',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  UNKNOWN_SERVICE: {
    errorCode: '8',
    errorMessage: 'Unknown service: ',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  UNKNOWN_SERVICE_FUNCTION: {
    errorCode: '9',
    errorMessage: 'Unknown function: ',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  MISSING_SERVICE_FUNCTION_ARGUMENT: {
    errorCode: '10',
    errorMessage: 'Missing service function argument',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED: {
    errorCode: '11',
    errorMessage: 'Remote service function call not allowed',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  TOO_MANY_SERVICE_FUNCTIONS_CALLED: {
    errorCode: '12',
    errorMessage: 'Too many service functions called',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  REMOTE_SERVICE_FUNCTION_CALL_NOT_ALLOWED_INSIDE_TRANSACTION: {
    errorCode: '13',
    errorMessage: 'Remote service function call not allowed inside transaction',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  ALLOWED_REMOTE_SERVICE_FUNCTIONS_REGEXP_PATTERN_NOT_DEFINED: {
    errorCode: '14',
    errorMessage: 'Allowed remote service functions regular expression pattern not defined',
    statusCode: HttpStatusCodes.BAD_REQUEST
  },
  HTTP_METHOD_MUST_BE_POST: {
    errorCode: '15',
    errorMessage: 'Invalid HTTP method. HTTP method must be POST',
    statusCode: HttpStatusCodes.BAD_REQUEST
  }
};
