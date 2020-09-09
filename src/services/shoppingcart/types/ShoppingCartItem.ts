import { IsInt, Max, MaxLength, Min } from "class-validator";
import Entity from "../../../backk/Entity";

@Entity
export default class ShoppingCartItem {
  @MaxLength(24)
  id!: string;

  @MaxLength(24)
  salesItemId!: string;

  @IsInt()
  @Min(1)
  @Max(1000000)
  quantity!: number;
}
