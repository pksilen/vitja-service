// eslint-disable-next-line @typescript-eslint/class-name-casing
import { Unique } from "../../decorators/typeproperty/Unique";
import IsStringOrObjectId from "../../decorators/typeproperty/IsStringOrObjectId";
import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";

export default class UserAccountId {
  @Unique()
  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  userAccountId!: string;
}
