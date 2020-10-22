import { MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";

@Entity()
export default class ShoppingCartItem {
  @MaxLength(24)
  id!: string;

  @MaxLength(24)
  salesItemId!: string;
}
