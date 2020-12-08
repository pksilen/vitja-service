import _IdAndCaptcha from "./_IdAndCaptcha";
import { IsNumberString, IsString, MaxLength } from "class-validator";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndVersion extends _IdAndCaptcha {
  @IsUndefined({groups: ['__backk_create__', '__backk_update__']})
  @IsString({ groups: ['__backk_none__'] })
  @MaxLength(25, { groups: ['__backk_none__'] })
  @IsNumberString({ groups: ['__backk_none__'] })
  version!: string;
}
