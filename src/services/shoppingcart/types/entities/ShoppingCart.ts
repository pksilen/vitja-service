import { MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import { Id } from '../../../../backk/Backk';
import ShoppingCartItem from './ShoppingCartItem';

@Entity()
export default class ShoppingCart extends Id {
  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
}
