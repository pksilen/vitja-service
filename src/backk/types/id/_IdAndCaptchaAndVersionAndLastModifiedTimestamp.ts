import _IdAndCaptchaAndVersion from "./_IdAndCaptchaAndVersion";
import { IsDate } from "class-validator";
import IsUndefined from "../../decorators/typeproperty/IsUndefined";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndCaptchaAndVersionAndLastModifiedTimestamp extends _IdAndCaptchaAndVersion {
  @IsUndefined({groups: ['__backk_create__']})
  @IsDate({ groups: ['__backk_none__'] })
  readonly lastModifiedTimestamp!: Date;
}
