import { IsString, MaxLength } from "class-validator";
import _Id from "./_Id";

export default class IdAndUserId extends _Id {
  @IsString()
  @MaxLength(24)
  userId!: string;
}
