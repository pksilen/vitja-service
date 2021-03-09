import MinMax from "../../../../backk/decorators/typeproperty/MinMax";
import { TestValue } from "../../../../backk/decorators/typeproperty/testing/TestValue";

export default class ChangeExpiredReservedSalesItemsStateToForSaleArg {
  @MinMax(0, 15)
  @TestValue(0)
  maxSalesItemReservationDurationInMinutes: number = 15;
}
