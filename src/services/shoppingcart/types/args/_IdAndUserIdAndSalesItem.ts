import _IdAndUserId from "../../../../backk/types/id/_IdAndUserId";
import ShoppingCartSalesItem from "../entities/ShoppingCartSalesItem";

// eslint-disable-next-line @typescript-eslint/class-name-casing
export default class _IdAndUserIdAndSalesItem extends _IdAndUserId {
  salesItem!: ShoppingCartSalesItem;
}
