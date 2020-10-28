import { IsString } from "class-validator";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _Id {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  _id!: string;
}
