import _IdAndUserId from "../../../../backk/types/id/_IdAndUserId";
import ShoppingCartOrOrderSalesItem from "../../../orders/types/entities/ShoppingCartOrOrderSalesItem";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserIdAndSalesItem extends _IdAndUserId {
  salesItem!: ShoppingCartOrOrderSalesItem;
}
