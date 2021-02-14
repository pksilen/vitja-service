import _IdAndVersionAndCreatedAtTimestamp from './_IdAndVersionAndCreatedAtTimestamp';
import { Entity } from '../entities/Entity';
import { IsDate } from 'class-validator';
import IsUndefined from '../../decorators/typeproperty/IsUndefined';

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp
  extends _IdAndVersionAndCreatedAtTimestamp
  implements Entity {
  @IsUndefined({ groups: ['__backk_create__'] })
  @IsDate({ groups: ['__backk_none__'] })
  lastModifiedTimestamp!: Date;
}
