import MaxLengthAndMatches from "../../decorators/typeproperty/MaxLengthAndMatches";
import { Entity } from "../entities/Entity";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import IsStringOrObjectId from "../../decorators/typeproperty/IsStringOrObjectId";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _Id implements Entity {
  @IsUndefined({ groups: ['__backk_create__'] })
  @IsStringOrObjectId({ groups: ['__backk_update__'] })
  @MaxLengthAndMatches(24, /^[a-f\d]{1,24}$/, { groups: ['__backk_update__'] })
  public _id!: string;
}
