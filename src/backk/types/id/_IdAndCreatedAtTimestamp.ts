import _Id from "./_Id";
import { Entity } from "../entities/Entity";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCreatedAtTimestamp extends _Id implements Entity {
  createdAtTimestamp!: Date;
}
