import { ErrorResponse } from '../../../../../types/ErrorResponse';
import { Entity } from '../../../../../types/entities/Entity';
import isErrorResponse from '../../../../../errors/isErrorResponse';
import AbstractDbManager from '../../../../AbstractDbManager';

export default async function tryUpdateEntityLastModifiedTimestampIfNeeded<T extends Entity>(
  dbManager: AbstractDbManager,
  currentEntityOrErrorResponse: T | ErrorResponse,
  EntityClass: new () => T,
  shouldUpdateDb = true
) {
  if ('errorMessage' in currentEntityOrErrorResponse && isErrorResponse(currentEntityOrErrorResponse)) {
    return;
  }

  if (
    'lastModifiedTimestamp' in currentEntityOrErrorResponse &&
    currentEntityOrErrorResponse.lastModifiedTimestamp instanceof Date
  ) {
    currentEntityOrErrorResponse.lastModifiedTimestamp = new Date();

    if (shouldUpdateDb) {
      const possibleErrorResponse = await dbManager.updateEntity(
        {
          lastModifiedTimestamp: currentEntityOrErrorResponse.lastModifiedTimestamp,
          _id: currentEntityOrErrorResponse._id
        } as any,
        EntityClass,
        []
      );

      if (possibleErrorResponse) {
        throw possibleErrorResponse;
      }
    }
  }
}
