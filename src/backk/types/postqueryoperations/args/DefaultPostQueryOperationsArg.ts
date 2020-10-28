import DefaultPostQueryOperations from "../DefaultPostQueryOperations";
import { IsInstance, ValidateNested } from "class-validator";

export default class DefaultPostQueryOperationsArg {
  @IsInstance(DefaultPostQueryOperations)
  @ValidateNested()
  _postQueryOperations!: DefaultPostQueryOperations
}
