import _IdAndVersion from './_IdAndVersion';
import { Entity } from '../entities/Entity';

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndCreatedAtTimestamp extends _IdAndVersion implements Entity {
  createdAtTimestamp!: Date;
}
