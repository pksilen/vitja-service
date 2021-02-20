import { ErrorResponse } from "../../../../../types/ErrorResponse";
import AbstractDbManager from "../../../../AbstractDbManager";
import { BackkEntity } from "../../../../../types/entities/BackkEntity";

export default async function tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded<T extends BackkEntity>(
  dbManager: AbstractDbManager,
  currentEntityOrErrorResponse: T | ErrorResponse,
  EntityClass: new () => T
) {
  if ('errorMessage' in currentEntityOrErrorResponse) {
    return;
  }

  if ('version' in currentEntityOrErrorResponse || 'lastModifiedTimestamp' in currentEntityOrErrorResponse) {
    const possibleErrorResponse = await dbManager.updateEntity(
      {
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
