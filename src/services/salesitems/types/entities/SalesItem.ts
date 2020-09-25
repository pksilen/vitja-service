import { IsInt, IsNumber, Max, Min } from "class-validator";
import UpdateSalesItemArg from "../args/UpdateSalesItemArg";
import { ExpectAnyValueInTests } from "../../../../backk/ExpectAnyValueInTests";
import Entity from "../../../../backk/Entity";

@Entity
export class SalesItem extends UpdateSalesItemArg {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(-1)
  @Max(1000000000)
  previousPrice!: number;

  state!: 'forSale' | 'sold';

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  createdTimestampInSecs!: number;
}
