import { IsString, MaxLength } from "class-validator";
import _Id from "./_Id";
import { Transient } from "../../decorators/typeproperty/Transient";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptcha extends _Id {
  @Transient()
  @IsString()
  @MaxLength(512)
  captchaToken!: string;
}
