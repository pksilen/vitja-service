import Entity from "../../../../backk/Entity";
import UpdateOrderArg from "../args/UpdateOrderArg";
import { IsInt, Max, Min } from "class-validator";
import { ExpectAnyValueInTests } from "../../../../backk/ExpectAnyValueInTests";

@Entity
export default class Order extends UpdateOrderArg {
  state!: 'toBeDelivered' | 'delivering' | 'delivered';

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  createdTimestampInSecs!: number;
}
