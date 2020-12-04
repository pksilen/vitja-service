import { ErrorResponse } from '../../../../../types/ErrorResponse';
import updateEntity from '../updateEntity';
import PostgreSqlDbManager from '../../../../PostgreSqlDbManager';
import { Entity } from '../../../../../types/entities/Entity';
import isErrorResponse from '../../../../../errors/isErrorResponse';

export default async function tryUpdateEntityLastModifiedTimestampIfNeeded<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  currentEntityOrErrorResponse: T | ErrorResponse,
  EntityClass: new () => T
) {
  if ('errorMessage' in currentEntityOrErrorResponse && isErrorResponse(currentEntityOrErrorResponse)) {
    return;
  }

  if (
    'lastModifiedTimestamp' in currentEntityOrErrorResponse &&
    currentEntityOrErrorResponse.lastModifiedTimestamp instanceof Date
  ) {
    const lastModifiedTimestamp = new Date();
    const possibleErrorResponse = await updateEntity(
      dbManager,
      { lastModifiedTimestamp, _id: currentEntityOrErrorResponse._id } as any,
      EntityClass, []
    );
    if (possibleErrorResponse) {
      throw possibleErrorResponse;
    }
  }
}
