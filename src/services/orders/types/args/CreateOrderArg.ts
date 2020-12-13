import { ArrayMaxSize, ArrayUnique } from "class-validator";
import PaymentInfo from "../entities/PaymentInfo";

export default class CreateOrderArg {
  userId!: string;
  shoppingCartId!: string;

  @ArrayMaxSize(50)
  @ArrayUnique()
  salesItemIds!: string[];

  paymentInfo!: PaymentInfo;
}
