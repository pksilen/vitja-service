import _IdAndCreatedAtTimestamp from './_IdAndCreatedAtTimestamp';
import { Entity } from '../Entity';
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCreatedAtTimestampAndLastModifiedTimestamp extends _IdAndCreatedAtTimestamp
  implements Entity {
  @IsDate()
  lastModifiedTimestamp!: Date;
}
