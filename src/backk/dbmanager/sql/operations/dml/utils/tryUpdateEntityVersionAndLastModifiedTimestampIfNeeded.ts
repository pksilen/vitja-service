import AbstractDbManager from "../../../../AbstractDbManager";
import { BackkEntity } from "../../../../../types/entities/BackkEntity";

export default async function tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded<T extends BackkEntity>(
  dbManager: AbstractDbManager,
  currentEntity: T,
  EntityClass: new () => T
) {
  if ('version' in currentEntity || 'lastModifiedTimestamp' in currentEntity) {
    const [, error] = await dbManager.updateEntity(
      {
        _id: currentEntity._id,
      } as any,
      EntityClass
    );

    if (error) {
      throw error;
    }
  }
}
