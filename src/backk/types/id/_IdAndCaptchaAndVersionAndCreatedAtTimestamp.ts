import _IdAndCaptchaAndVersion from "./_IdAndCaptchaAndVersion";
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndVersionAndCreatedAtTimestamp extends _IdAndCaptchaAndVersion {
  @IsDate()
  readonly createdAtTimestamp!: Date;
}
