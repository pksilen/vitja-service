import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import { IsInt } from "class-validator";

export default class DeleteOldUnsoldSalesItemsArg {
  @IsInt()
  @MinMax(-1, 12)
  @TestValue(-1)
  deletableUnsoldSalesItemMinAgeInMonths: number = 4
}
