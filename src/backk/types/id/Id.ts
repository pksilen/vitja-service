import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import IsStringOrObjectId from "../../decorators/typeproperty/IsStringOrObjectId";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";

export default class Id {
  @IsUndefined({ groups: ['__backk_create__', '__backk_update__'] })
  @IsStringOrObjectId({ groups: ['__backk_update__'] })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, { groups: ['__backk_update__'] })
  readonly _id?: string;

  @IsStringOrObjectId()
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/)
  public id!: string;
}
