import { MaxLength } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/Id";

@Entity()
export default class ShoppingCartItem extends Id {
  @MaxLength(24)
  salesItemId!: string;
}
