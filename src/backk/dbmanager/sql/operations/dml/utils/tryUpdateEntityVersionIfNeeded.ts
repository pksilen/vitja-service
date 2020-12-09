import { ErrorResponse } from '../../../../../types/ErrorResponse';
import updateEntity from '../updateEntity';
import AbstractSqlDbManager from '../../../../AbstractSqlDbManager';
import { Entity } from '../../../../../types/entities/Entity';
import isErrorResponse from '../../../../../errors/isErrorResponse';

export default async function tryUpdateEntityVersionIfNeeded<T extends Entity>(
  dbManager: AbstractSqlDbManager,
  currentEntityOrErrorResponse: T | ErrorResponse,
  EntityClass: new () => T
) {
  if ('errorMessage' in currentEntityOrErrorResponse && isErrorResponse(currentEntityOrErrorResponse)) {
    return;
  }

  if (
    'version' in currentEntityOrErrorResponse &&
    currentEntityOrErrorResponse.version &&
    currentEntityOrErrorResponse.version.match(/^\d+$/)
  ) {
    const version = (parseInt(currentEntityOrErrorResponse.version, 10) + 1).toString();
    const possibleErrorResponse = await updateEntity(
      dbManager,
      { version, _id: currentEntityOrErrorResponse._id } as any,
      EntityClass, []
    );
    if (possibleErrorResponse) {
      throw possibleErrorResponse;
    }
  }
}
