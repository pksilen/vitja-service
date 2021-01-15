import UserDefinedFilter from "../../../../backk/types/userdefinedfilters/UserDefinedFilter";
import { ArrayMaxSize } from "class-validator";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class GetSalesItemsByUserDefinedFiltersArg {
  @ArrayMaxSize(10)
  @TestValue([{
    fieldName: 'title',
    operator: '=',
    value: 'abc'
  }])
  filters!: UserDefinedFilter[];
}
