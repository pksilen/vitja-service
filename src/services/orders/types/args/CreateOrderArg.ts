import ShoppingCartItem from '../../../shoppingcart/types/entities/ShoppingCartItem';
import { Max, MaxLength, Min } from "class-validator";
import IsBigInt from "../../../../backk/IsBigInt";

export default class CreateOrderArg {
  @MaxLength(24)
  userId!: string;

  @IsBigInt()
  @Min(0)
  @Max(10000)
  testValue!: number;

  shoppingCartItems!: ShoppingCartItem[];
}