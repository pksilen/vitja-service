import _IdAndUserId from "../../../../backk/types/id/_IdAndUserId";
import ShoppingCartOrOrderSalesItem from "../../../orders/types/entities/ShoppingCartOrOrderSalesItem";

export default class AddToShoppingCartArg extends _IdAndUserId {
  public salesItem!: ShoppingCartOrOrderSalesItem;
}
