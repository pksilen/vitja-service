import IsUndefined from "../decorators/typeproperty/IsUndefined";
import { IsString, Max, MaxLength, Min } from "class-validator";
import IsBigInt from "../decorators/typeproperty/IsBigInt";

export default class Version {
  @IsUndefined({groups: ['__backk_create__']})
  @IsString({ groups: ['__backk_none__'] })
  @MaxLength(25, { groups: ['__backk_none__'] })
  @IsBigInt({ groups: ['__backk_none__'] })
  @Min(-1)
  @Max(Number.MAX_SAFE_INTEGER)
  version!: number;
}
