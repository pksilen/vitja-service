import _IdAndCreatedAtTimestamp from './_IdAndCreatedAtTimestamp';
import { Entity } from '../entities/Entity';
import { IsDate } from "class-validator";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCreatedAtTimestampAndLastModifiedTimestamp extends _IdAndCreatedAtTimestamp
  implements Entity {
  @IsUndefined({groups: ['__backk_create__', '__backk_update__']})
  @IsDate()
  readonly lastModifiedTimestamp!: Date;
}
