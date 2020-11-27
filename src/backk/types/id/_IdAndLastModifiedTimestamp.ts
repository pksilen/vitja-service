import _Id from "./_Id";
import { Entity } from "../Entity";
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndLastModifiedTimestamp extends _Id implements Entity {
  @IsDate()
  lastModifiedTimestamp!: Date;
}
