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
