import { IsString } from "class-validator";
import _Id from "./_Id";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { BackkEntity } from "../entities/BackkEntity";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserId extends _Id implements BackkEntity {
  @IsString()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  public userId!: string;
}
