import { IsInt, IsPositive } from 'class-validator';
import Entity from "../../../backk/Entity";

@Entity
export default class ShoppingCartItem {
  id!: string;

  salesItemId!: string;

  @IsInt()
  @IsPositive()
  quantity!: number;
}
