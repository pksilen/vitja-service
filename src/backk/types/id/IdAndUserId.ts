import { IsString } from "class-validator";
import _Id from "./_Id";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

export default class IdAndUserId extends _Id {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  userId!: string;
}
