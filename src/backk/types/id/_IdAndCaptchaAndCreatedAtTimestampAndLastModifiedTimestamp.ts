import { IsDate } from 'class-validator';
import _IdAndCaptchaAndCreatedAtTimestamp from './_IdAndCaptchaAndCreatedAtTimestamp';

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndCreatedAtTimestampAndLastModifiedTimestamp extends _IdAndCaptchaAndCreatedAtTimestamp {
  @IsDate()
  readonly lastModifiedTimestamp!: Date;
}
