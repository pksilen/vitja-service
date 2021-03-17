import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import { IsInt } from "class-validator";

export default class DeleteOldUnsoldSalesItemsArg {
  @IsInt()
  @MinMax(0, 12)
  @TestValue(0)
  deletableUnsoldSalesItemMinAgeInMonths: number = 4
}
