import { IsInt } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class DeleteIncompleteOrdersArg {
  @IsInt()
  @MinMax(-1, 60)
  @TestValue(-1)
  incompleteOrderTtlInMinutes: number = 60
}
