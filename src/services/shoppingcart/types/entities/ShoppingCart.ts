import Entity from "../../../../backk/decorators/entity/Entity";
import _Id from "../../../../backk/types/id/_Id";
import { ArrayMaxSize } from "class-validator";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import ShoppingCartOrOrderSalesItem from "../../../orders/types/entities/ShoppingCartOrOrderSalesItem";

@Entity()
export default class ShoppingCart extends _Id {
  @Unique()
  public userId!: string;

  @ArrayMaxSize(50)
  public salesItems!: ShoppingCartOrOrderSalesItem[];
}
