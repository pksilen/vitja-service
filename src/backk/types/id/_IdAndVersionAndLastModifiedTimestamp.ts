import _IdAndVersion from "./_IdAndVersion";
import { Entity } from "../entities/Entity";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndLastModifiedTimestamp extends _IdAndVersion implements Entity {
  lastModifiedTimestamp!: Date;
}
