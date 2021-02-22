import UserDefinedFilter from "../../../../backk/types/userdefinedfilters/UserDefinedFilter";
import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class GetSalesItemsByUserDefinedFiltersArg {
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @TestValue([{
    fieldName: 'title',
    operator: '=',
    value: 'abc'
  }])
  filters!: UserDefinedFilter[];
}
