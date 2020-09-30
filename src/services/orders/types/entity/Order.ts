import Entity from "../../../../backk/annotations/entity/Entity";
import UpdateOrderArg from "../args/UpdateOrderArg";
import { IsInt, Max, MaxLength, Min } from "class-validator";
import { ExpectAnyValueInTests } from "../../../../backk/ExpectAnyValueInTests";
import DeliverOrderArg from "../args/DeliverOrderArg";

@Entity()
export default class Order extends UpdateOrderArg
  implements DeliverOrderArg {
  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  createdTimestampInSecs!: number;

  @IsInt()
  @Min(0)
  @Max(2147483647)
  @ExpectAnyValueInTests()
  deliveryTimestampInSecs!: number;

  state!: "toBeDelivered" | "delivering" | "delivered" | "returning" | "returned";

  @MaxLength(1024)
  trackingUrl!: string;
}
