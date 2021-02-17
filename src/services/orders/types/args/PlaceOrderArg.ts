import { ArrayMaxSize } from "class-validator";
import PaymentInfo from "../entities/PaymentInfo";
import { Values } from "../../../../backk/constants/constants";
import ShoppingCartOrOrderSalesItem from "../entities/ShoppingCartOrOrderSalesItem";

export default class PlaceOrderArg {
  userId!: string;
  shoppingCartId!: string;

  @ArrayMaxSize(Values._50)
  salesItems!: ShoppingCartOrOrderSalesItem[];

  paymentInfo!: PaymentInfo;
}
