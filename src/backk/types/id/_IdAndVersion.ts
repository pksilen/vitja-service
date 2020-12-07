import _Id from "./_Id";
import { IsNumberString, IsString, MaxLength } from "class-validator";
import { Entity } from "../entities/Entity";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersion extends _Id implements Entity {
  @IsUndefined({groups: ['__backk_create__', '__backk_update__']})
  @IsString()
  @MaxLength(25)
  @IsNumberString()
  version!: string;
}
