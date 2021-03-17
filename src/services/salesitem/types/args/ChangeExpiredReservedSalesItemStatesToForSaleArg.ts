import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";
import { IsInt } from "class-validator";

export default class ChangeExpiredReservedSalesItemStatesToForSaleArg {
  @IsInt()
  @MinMax(0, 15)
  @TestValue(0)
  maxSalesItemReservationDurationInMinutes: number = 15;
}
