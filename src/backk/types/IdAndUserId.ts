import { IsString, MaxLength } from "class-validator";
import Id from "./Id";

export default class IdAndUserId extends Id {
  @IsString()
  @MaxLength(24)
  userId!: string;
}
