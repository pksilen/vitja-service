import { IsString } from "class-validator";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

export default class Id {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  id!: string;
}
