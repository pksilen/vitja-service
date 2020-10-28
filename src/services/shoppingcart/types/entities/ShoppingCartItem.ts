import Entity from "../../../../backk/decorators/entity/Entity";
import Id from "../../../../backk/types/id/Id";

@Entity()
export default class ShoppingCartItem extends Id {
  salesItemId!: string;
}
