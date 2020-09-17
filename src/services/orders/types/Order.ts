import Entity from "../../../backk/Entity";
import OrderWithoutCreatedTimestampAndState from "./OrderWithoutCreatedTimestampAndState";
import { IsInt, Max, Min } from "class-validator";
import { ExpectAnyValueInTests } from "../../../backk/ExpectAnyValueInTests";

@Entity
export default class Order extends OrderWithoutCreatedTimestampAndState {
  state!: 'toBeDelivered' | 'delivering' | 'delivered';

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  createdTimestampInSecs!: number;
}
