import _IdAndCaptcha from "./_IdAndCaptcha";
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndCreatedAtTimestamp extends _IdAndCaptcha {
  @IsDate()
  readonly createdAtTimestamp!: Date;
}
