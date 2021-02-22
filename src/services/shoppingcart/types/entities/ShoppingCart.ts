import Entity from "../../../../backk/decorators/entity/Entity";
import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import { ManyToMany } from "../../../../backk/decorators/typeproperty/ManyToMany";
import ShoppingCartOrOrderSalesItem from "./ShoppingCartOrOrderSalesItem";
import _IdAndUserAccountId from "../../../../backk/types/id/_IdAndUserAccountId";

@Entity()
export default class ShoppingCart extends _IdAndUserAccountId {
  @ManyToMany()
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  public salesItems!: ShoppingCartOrOrderSalesItem[];
}
