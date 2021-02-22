import { IsString } from "class-validator";
import _Id from "./_Id";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { BackkEntity } from "../entities/BackkEntity";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserAccountId extends _Id implements BackkEntity {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  public userAccountId!: string;
}
