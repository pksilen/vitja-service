import _Id from "./_Id";
import { IsNumberString, IsString, MaxLength } from "class-validator";
import { Entity } from "../Entity";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersion extends _Id implements Entity {
  @IsString()
  @MaxLength(25)
  @IsNumberString()
  version!: string;
}
