import ShoppingCart from "../../../shoppingcart/types/entities/ShoppingCart";
import { PaymentGateway } from "../enum/PaymentGateway";

export default class PlaceOrderArg {
  shoppingCart!: ShoppingCart;
  paymentGateway!: PaymentGateway;
}
