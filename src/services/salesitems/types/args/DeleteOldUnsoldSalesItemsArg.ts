import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class DeleteOldUnsoldSalesItemsArg {
  @MinMax(0, 12)
  @TestValue(0)
  deletableUnsoldSalesItemMinAgeInMonths: number = 4
}
