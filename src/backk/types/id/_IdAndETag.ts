import _Id from "./_Id";
import { IsString, MaxLength } from "class-validator";
import { IsInternalField } from "../../decorators/typeproperty/IsInternalField";
import IsAnyString from "../../decorators/typeproperty/IsAnyString";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndETag extends _Id {
  @IsString()
  @MaxLength(64)
  @IsInternalField()
  @IsAnyString()
  ETag!: string;
}
