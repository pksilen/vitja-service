import _Id from "./_Id";
import { IsString, MaxLength } from "class-validator";
import { Entity } from "../entities/Entity";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import IsIntegerStringOrAny from "../../decorators/typeproperty/IsIntegerStringOrAny";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersion extends _Id implements Entity {
  @IsUndefined({groups: ['__backk_create__']})
  @IsString({ groups: ['__backk_none__'] })
  @MaxLength(25, { groups: ['__backk_none__'] })
  @IsIntegerStringOrAny({ groups: ['__backk_none__'] })
  version!: string;
}
