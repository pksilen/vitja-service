import { MaxLength } from 'class-validator';
import Entity from '../../../../backk/decorators/entity/Entity';
import ShoppingCartItem from './ShoppingCartItem';
import _Id from "../../../../backk/types/_Id";

@Entity()
export default class ShoppingCart extends _Id {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
}
