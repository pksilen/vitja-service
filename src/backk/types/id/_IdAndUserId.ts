import { IsString } from "class-validator";
import _Id from "./_Id";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserId extends _Id {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  userId!: string;
}
