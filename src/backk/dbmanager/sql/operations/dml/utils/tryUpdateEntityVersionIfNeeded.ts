import { ErrorResponse } from "../../../../../types/ErrorResponse";
import AbstractDbManager from "../../../../AbstractDbManager";
import { Entity } from "../../../../../types/entities/Entity";
import isErrorResponse from "../../../../../errors/isErrorResponse";

export default async function tryUpdateEntityVersionIfNeeded<T extends Entity>(
  dbManager: AbstractDbManager,
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
    const possibleErrorResponse = await dbManager.updateEntity(
      { version, _id: currentEntityOrErrorResponse._id } as any,
      EntityClass, []
    );
    if (possibleErrorResponse) {
      throw possibleErrorResponse;
    }
  }
}
