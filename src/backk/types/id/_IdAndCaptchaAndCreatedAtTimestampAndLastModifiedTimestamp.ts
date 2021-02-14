import _IdAndCaptchaAndCreatedAtTimestamp from "./_IdAndCaptchaAndCreatedAtTimestamp";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";
import IsDateOrAny from "../../decorators/typeproperty/IsDateOrAny";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndCreatedAtTimestampAndLastModifiedTimestamp extends _IdAndCaptchaAndCreatedAtTimestamp {
  @IsUndefined({groups: ['__backk_create__']})
  @IsDateOrAny({ groups: ['__backk_none__'] })
  lastModifiedTimestamp!: Date;
}
