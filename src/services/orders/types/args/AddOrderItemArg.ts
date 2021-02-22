import Version from "../../../../backk/types/Version";
import ShoppingCartOrOrderSalesItem from "../../../shoppingcarts/types/entities/ShoppingCartOrOrderSalesItem";

export default class AddOrderItemArg extends Version {
  orderId!: string;
  salesItem!: ShoppingCartOrOrderSalesItem;
}
