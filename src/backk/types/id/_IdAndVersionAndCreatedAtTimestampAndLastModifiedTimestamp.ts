import _IdAndVersionAndCreatedAtTimestamp from './_IdAndVersionAndCreatedAtTimestamp';
import { Entity } from "../Entity";
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp
  extends _IdAndVersionAndCreatedAtTimestamp
  implements Entity {
  @IsDate()
  lastModifiedTimestamp!: Date;
}
