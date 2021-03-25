import { IsInt } from "class-validator";
import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class DeleteUnpaidOrdersArg {
  @IsInt()
  @MinMax(-1, 10)
  @TestValue(-1)
  unpaidOrderTimeToLiveInMinutes: number = 10
}
