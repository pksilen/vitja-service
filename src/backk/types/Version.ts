import IsUndefined from "../decorators/typeproperty/IsUndefined";
import { IsString, MaxLength } from "class-validator";
import IsIntegerStringOrAny from "../decorators/typeproperty/IsIntegerStringOrAny";

export default class Version {
  @IsUndefined({groups: ['__backk_create__']})
  @IsString({ groups: ['__backk_none__'] })
  @MaxLength(25, { groups: ['__backk_none__'] })
  @IsIntegerStringOrAny({ groups: ['__backk_none__'] })
  version!: string;
}
