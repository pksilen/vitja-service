import { IsInt, IsPositive } from 'class-validator';

export default class ShoppingCartItem {
  id!: string;

  salesItemId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
