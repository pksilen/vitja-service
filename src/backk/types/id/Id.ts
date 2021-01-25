import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../decorators/typeproperty/IsStringOrObjectId";

export default class Id {
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]+$/)
  public id!: string;
}
