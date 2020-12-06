import _IdAndCaptchaAndVersionAndCreatedAtTimestamp from "./_IdAndCaptchaAndVersionAndCreatedAtTimestamp";
import { IsDate } from "class-validator";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndVersionAndCreatedAtTimestampAndLastModifiedTimestamp extends _IdAndCaptchaAndVersionAndCreatedAtTimestamp {
  @IsDate()
  readonly lastModifiedTimestamp!: Date;
}
