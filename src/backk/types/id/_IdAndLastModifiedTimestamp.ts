import _Id from "./_Id";
import { Entity } from "../entities/Entity";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import IsDateOrAny from "../../decorators/typeproperty/IsDateOrAny";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndLastModifiedTimestamp extends _Id implements Entity {
  @IsUndefined({groups: ['__backk_create__']})
  @IsDateOrAny({ groups: ['__backk_none__'] })
  readonly lastModifiedTimestamp!: Date;
}
