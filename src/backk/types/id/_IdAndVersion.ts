import _Id from "./_Id";
import { IsString, Max, MaxLength, Min } from "class-validator";
import { BackkEntity } from "../entities/BackkEntity";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import IsBigInt from "../../decorators/typeproperty/IsBigInt";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndVersion extends _Id implements BackkEntity {
  @IsUndefined({groups: ['__backk_create__']})
  @IsString({ groups: ['__backk_none__'] })
  @MaxLength(24, { groups: ['__backk_none__'] })
  @IsBigInt({ groups: ['__backk_none__'] })
  @Min(-1)
  @Max(Number.MAX_SAFE_INTEGER)
  public version!: number;
}
