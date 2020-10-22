import { MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import ShoppingCartItem from './ShoppingCartItem';
import Id from "../../../../backk/types/Id";

@Entity()
export default class ShoppingCart extends Id {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
}
