import ShoppingCartOrOrderSalesItem from "../entities/ShoppingCartOrOrderSalesItem";
import _IdAndUserAccountId from "../../../../backk/types/id/_IdAndUserAccountId";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserAccountIdAndSalesItem extends _IdAndUserAccountId {
  salesItem!: ShoppingCartOrOrderSalesItem;
}
