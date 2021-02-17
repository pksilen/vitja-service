import { ArrayMaxSize, ArrayUnique } from "class-validator";
import PaymentInfo from "../entities/PaymentInfo";
import { Values } from "../../../../backk/constants/constants";
import { SalesItem } from "../../../salesitems/types/entities/SalesItem";

export default class PlaceOrderArg {
  userId!: string;
  shoppingCartId!: string;

  @ArrayMaxSize(Values._50)
  salesItems!: SalesItem[];

  paymentInfo!: PaymentInfo;
}
