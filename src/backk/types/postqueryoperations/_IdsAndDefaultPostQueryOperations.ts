import { ArrayMaxSize, IsArray, IsString, MaxLength } from "class-validator";
import DefaultPostQueryOperations from "./DefaultPostQueryOperations";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdsAndDefaultPostQueryOperations extends DefaultPostQueryOperations {
  @IsString({ each: true })
  // TODO replace with MaxLengthAndMacthes annotation
  @MaxLength(24, { each: true })
  @IsArray()
  @ArrayMaxSize(1000)
  _ids!: string[];
}
