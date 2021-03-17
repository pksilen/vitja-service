import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import { IsInt } from "class-validator";

export default class ChangeExpiredReservedSalesItemStatesToForSaleArg {
  @IsInt()
  @MinMax(-1, 15)
  @TestValue(-1)
  maxSalesItemReservationDurationInMinutes: number = 15;
}
