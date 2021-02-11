import { IsString, MaxLength } from "class-validator";
import { IsInternalField } from "../decorators/typeproperty/IsInternalField";
import IsAnyString from "../decorators/typeproperty/IsAnyString";

export default class ETag {
  @IsString()
  @MaxLength(64)
  @IsInternalField()
  @IsAnyString()
  ETag!: string;
}
