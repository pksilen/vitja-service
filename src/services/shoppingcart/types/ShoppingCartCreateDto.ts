import ShoppingCartItem from './ShoppingCartItem';
import { MaxLength } from "class-validator";

export default class ShoppingCartCreateDto {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
}
