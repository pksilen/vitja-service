import Entity from "../../../../backk/decorators/entity/Entity";
import ShoppingCartItem from "./ShoppingCartItem";
import _Id from "../../../../backk/types/id/_Id";
import { ArrayMaxSize } from "class-validator";

@Entity()
export default class ShoppingCart extends _Id {
  userId!: string;

  @ArrayMaxSize(50)
  shoppingCartItems!: ShoppingCartItem[];
}
