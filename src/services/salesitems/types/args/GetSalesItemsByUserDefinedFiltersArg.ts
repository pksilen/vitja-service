import UserDefinedFilter from "../../../../backk/types/userdefinedfilters/UserDefinedFilter";
import { ArrayMaxSize } from "class-validator";

export default class GetSalesItemsByUserDefinedFiltersArg {
  @ArrayMaxSize(10)
  filters!: UserDefinedFilter[];
}
