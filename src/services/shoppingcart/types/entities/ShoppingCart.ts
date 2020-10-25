import Entity from "../../../../backk/decorators/entity/Entity";
import ShoppingCartItem from "./ShoppingCartItem";
import _Id from "../../../../backk/types/_Id";

@Entity()
export default class ShoppingCart extends _Id {
  userId!: string;
  shoppingCartItems!: ShoppingCartItem[];
}
