import ShoppingCartItem from '../../shoppingcart/types/ShoppingCartItem';
import { MaxLength } from "class-validator";

export default class OrderWithoutId {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
