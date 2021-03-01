import DefaultPostQueryOperations from "./DefaultPostQueryOperations";
import IsStringOrObjectId from "../../decorators/typeproperty/IsStringOrObjectId";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { Values } from "../../constants/constants";
import { IsString, MaxLength } from "class-validator";
import IsIntegerStringOrAny from "../../decorators/typeproperty/IsIntegerStringOrAny";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersionAndDefaultPostQueryOperations extends DefaultPostQueryOperations {
  @IsStringOrObjectId()
  @MaxLengthAndMatches(Values._24, /^[a-f\d]{1,24}$/)
  _id!: string;

  @IsString()
  @MaxLength(25)
  @IsIntegerStringOrAny()
  public version!: string;
}
