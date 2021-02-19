import Entity from "../../../../backk/decorators/entity/Entity";
import _Id from "../../../../backk/types/id/_Id";
import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";
import ShoppingCartOrOrderSalesItem from "../../../orders/types/entities/ShoppingCartOrOrderSalesItem";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";

@Entity()
export default class ShoppingCart extends _Id {
  @Unique()
  public userId!: string;

  @ManyToMany()
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  public salesItems!: ShoppingCartOrOrderSalesItem[];
}
