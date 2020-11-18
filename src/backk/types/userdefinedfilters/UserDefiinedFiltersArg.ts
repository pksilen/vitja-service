import { IsArray, IsInstance, ValidateNested } from 'class-validator';
import UserDefinedFilter from './UserDefinedFilter';

export default class UserDefinedFiltersArg {
  @IsInstance(UserDefinedFilter, { each: true })
  @ValidateNested({ each: true })
  @IsArray()
  _userDefinedFilters: UserDefinedFilter[] = [];
}
