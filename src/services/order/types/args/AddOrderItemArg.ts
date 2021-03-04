import ShoppingCartOrOrderSalesItem from "../../../shoppingcart/types/entities/ShoppingCartOrOrderSalesItem";

export default class AddOrderItemArg  {
  orderId!: string;
  salesItem!: ShoppingCartOrOrderSalesItem;
}
