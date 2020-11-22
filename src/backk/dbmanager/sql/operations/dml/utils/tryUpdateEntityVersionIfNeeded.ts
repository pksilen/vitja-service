import { ErrorResponse } from '../../../../../types/ErrorResponse';
import updateEntity from '../updateEntity';
import PostgreSqlDbManager from '../../../../PostgreSqlDbManager';
import { Entity } from '../../../../../types/entities/Entity';
import isErrorResponse from '../../../../../errors/isErrorResponse';

export default async function tryUpdateEntityVersionIfNeeded<T extends Entity>(
  dbManager: PostgreSqlDbManager,
  entityOrErrorResponse: T | ErrorResponse,
  EntityClass: new () => T
) {
  if ('errorMessage' in entityOrErrorResponse && isErrorResponse(entityOrErrorResponse)) {
    return;
  }

  if (
    'version' in entityOrErrorResponse &&
    entityOrErrorResponse.version &&
    entityOrErrorResponse.version.match(/^\d+$/)
  ) {
    const version = (parseInt(entityOrErrorResponse.version, 10) + 1).toString();
    const possibleErrorResponse = await updateEntity(
      dbManager,
      { version, _id: entityOrErrorResponse._id } as any,
      EntityClass
    );
    if (possibleErrorResponse) {
      throw possibleErrorResponse;
    }
  }
}
