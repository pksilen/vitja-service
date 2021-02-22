import Version from "../../../../backk/types/Version";
import ShoppingCartOrOrderSalesItem from "../../../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem";

export default class AddOrderItemArg extends Version {
  orderId!: string;
  salesItem!: ShoppingCartOrOrderSalesItem;
}
