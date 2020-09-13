import ShoppingCartItem from '../../shoppingcart/types/ShoppingCartItem';
import { Max, MaxLength, Min } from "class-validator";
import IsBigInt from "../../../backk/IsBigInt";

export default class OrderWithoutId {
  @MaxLength(24)
  userId!: string;

  @IsBigInt()
  @Min(0)
  @Max(10000)
  value!: number;

  shoppingCartItems!: ShoppingCartItem[];
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
