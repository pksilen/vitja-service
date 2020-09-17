import { IsInt, Max, Min } from "class-validator";
import SalesItemWithoutCreatedTimestampAndState from "./SalesItemWithoutCreatedTimestampAndState";
import { ExpectAnyValueInTests } from "../../../backk/ExpectAnyValueInTests";
import Entity from "../../../backk/Entity";

@Entity
export class SalesItem extends SalesItemWithoutCreatedTimestampAndState {
  state!: 'forSale' | 'sold';

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  createdTimestampInSecs!: number;
}
