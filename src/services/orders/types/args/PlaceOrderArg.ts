import ShoppingCart from "../../../shoppingcart/types/entities/ShoppingCart";
import { PaymentGateway } from "../enum/PaymentGateway";
import { IsUrl, MaxLength } from "class-validator";
import { Lengths } from "../../../../backk/constants/constants";

export default class PlaceOrderArg {
  shoppingCart!: ShoppingCart;
  paymentGateway: PaymentGateway = 'Paytrail';

  @MaxLength(Lengths._4K)
  @IsUrl()
  uiRedirectUrl!: string;
}
