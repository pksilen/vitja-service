import _IdAndVersion from "./_IdAndVersion";
import { Entity } from "../entities/Entity";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import IsDateOrAny from "../../decorators/typeproperty/IsDateOrAny";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndLastModifiedTimestamp extends _IdAndVersion implements Entity {
  @IsUndefined({groups: ['__backk_create__']})
  @IsDateOrAny({ groups: ['__backk_none__'] })
  lastModifiedTimestamp!: Date;
}
