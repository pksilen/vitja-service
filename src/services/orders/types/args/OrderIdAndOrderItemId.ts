import { MaxLength } from "class-validator";

export default class OrderIdAndOrderItemId {
  @MaxLength(24)
  orderId!: string;

  @MaxLength(24)
  orderItemId!: string;
}
