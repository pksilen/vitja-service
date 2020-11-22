import _IdAndCreatedAtTimestamp from './_IdAndCreatedAtTimestamp';
import { Entity } from '../entities/Entity';

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCreatedAtTimestampAndLastModifiedTimestamp extends _IdAndCreatedAtTimestamp
  implements Entity {
  lastModifiedTimestamp!: Date;
}
