import { MaxLength } from "class-validator";

export default class AddOrderItemArg {
  @MaxLength(24)
  orderId!: string;

  @MaxLength(24)
  salesItemId!: string;
}
