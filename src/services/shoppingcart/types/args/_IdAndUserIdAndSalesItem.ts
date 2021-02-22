import _IdAndUserAccountId from "../../../../backk/types/id/_IdAndUserId";
import ShoppingCartOrOrderSalesItem from "../entities/ShoppingCartOrOrderSalesItem";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserIdAndSalesItem extends _IdAndUserAccountId {
  salesItem!: ShoppingCartOrOrderSalesItem;
}
