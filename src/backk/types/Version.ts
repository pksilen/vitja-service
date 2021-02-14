import IsUndefined from "../decorators/typeproperty/IsUndefined";
import { IsNumberString, IsString, MaxLength } from "class-validator";

export default class Version {
  @IsUndefined({groups: ['__backk_create__']})
  @IsString({ groups: ['__backk_none__'] })
  @MaxLength(25, { groups: ['__backk_none__'] })
  @IsNumberString({ groups: ['__backk_none__'] })
  version!: string;
}
