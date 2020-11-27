import _IdAndVersion from "./_IdAndVersion";
import { Entity } from "../Entity";
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndLastModifiedTimestamp extends _IdAndVersion implements Entity {
  @IsDate()
  lastModifiedTimestamp!: Date;
}
