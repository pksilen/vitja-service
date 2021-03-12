import AbstractDbManager from '../../../../AbstractDbManager';
import { BackkEntity } from '../../../../../types/entities/BackkEntity';

export default async function tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded<T extends BackkEntity>(
  dbManager: AbstractDbManager,
  currentEntity: T,
  EntityClass: new () => T
) {
  if (currentEntity.version !== undefined) {
    const newVersion = parseInt(currentEntity.version, 10) + 1;
    const [, error] = await dbManager.updateEntity(
      {
        _id: currentEntity._id,
        version: newVersion
      } as any,
      EntityClass
    );

    if (error) {
      throw error;
    }
  }

  if ('lastModifiedTimestamp' in currentEntity) {
    const [, error] = await dbManager.updateEntity(
      {
        _id: currentEntity._id,
        lastModifiedTimestamp: new Date()
      } as any,
      EntityClass
    );

    if (error) {
      throw error;
    }
  }
}
