import _IdAndCaptcha from "./_IdAndCaptcha";
import { IsNumberString, IsString, MaxLength } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndVersion extends _IdAndCaptcha {
  @IsString()
  @MaxLength(25)
  @IsNumberString()
  readonly version!: string;
}
