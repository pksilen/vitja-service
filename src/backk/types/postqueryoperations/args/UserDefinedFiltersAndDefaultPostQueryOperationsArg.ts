import { IsArray, IsInstance, ValidateNested } from "class-validator";
import DefaultPostQueryOperations from "../DefaultPostQueryOperations";
import UserDefinedFilter from "../../userdefinedfilters/UserDefinedFilter";

export default class UserDefinedFiltersAndDefaultPostQueryOperationsArg {
  @IsInstance(UserDefinedFilter, { each: true })
  @ValidateNested({ each: true })
  @IsArray()
  _userDefinedFilters: UserDefinedFilter[] = [];

  @IsInstance(DefaultPostQueryOperations)
  @ValidateNested()
  _postQueryOperations!: DefaultPostQueryOperations
}
