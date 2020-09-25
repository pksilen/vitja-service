import ShoppingCartItem from '../entities/ShoppingCartItem';
import { MaxLength } from "class-validator";

export default class CreateShoppingCartArg {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
}
