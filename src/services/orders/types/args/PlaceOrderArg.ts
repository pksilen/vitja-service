import { ArrayMaxSize, ArrayUnique } from "class-validator";
import PaymentInfo from "../entities/PaymentInfo";
import { Values } from "../../../../backk/constants/constants";

export default class PlaceOrderArg {
  userId!: string;
  shoppingCartId!: string;

  @ArrayMaxSize(Values._50)
  @ArrayUnique()
  salesItemIds!: string[];

  paymentInfo!: PaymentInfo;
}
