import { IsInt, IsPositive, Max, Min } from "class-validator";
import Entity from "../../../backk/Entity";

@Entity
export default class ShoppingCartItem {
  id!: string;

  salesItemId!: string;

  @IsInt()
  @Min(1)
  @Max(1000000)
  quantity!: number;
}
