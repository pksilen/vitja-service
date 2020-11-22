import _IdAndVersionAndCreatedAtTimestamp from './_IdAndVersionAndCreatedAtTimestamp';
import { Entity } from "../entities/Entity";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp
  extends _IdAndVersionAndCreatedAtTimestamp
  implements Entity {
  lastModifiedTimestamp!: Date;
}
