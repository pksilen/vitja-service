import AbstractDbManager from '../../../../AbstractDbManager';
import { BackkEntity } from '../../../../../types/entities/BackkEntity';
import { ErrorOr } from '../../../../../types/PromiseOfErrorOr';

export default async function tryUpdateEntityVersionAndLastModifiedTimestampIfNeeded<T extends BackkEntity>(
  dbManager: AbstractDbManager,
  [currentEntity, error]: ErrorOr<T>,
  EntityClass: new () => T
) {
  if (error || currentEntity === null) {
    return;
  }

  if ('version' in currentEntity || 'lastModifiedTimestamp' in currentEntity) {
    const [, error] = await dbManager.updateEntity(
      {
        _id: currentEntity._id
      } as any,
      EntityClass,
      []
    );

    if (error) {
      throw error;
    }
  }
}
