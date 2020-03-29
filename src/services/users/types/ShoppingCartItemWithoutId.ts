import { IsInt, IsPositive } from 'class-validator';

export default class ShoppingCartItemWithoutId {
  salesItemId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
