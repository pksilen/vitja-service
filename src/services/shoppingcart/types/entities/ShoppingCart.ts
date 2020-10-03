import { MaxLength } from 'class-validator';
import Entity from '../../../../backk/annotations/entity/Entity';
import ShoppingCartItem from '../common/ShoppingCartItem';

@Entity()
export default class ShoppingCart {
  @MaxLength(24)
  _id!: string;

  @MaxLength(24)
  userId!: string;

  shoppingCartItems!: ShoppingCartItem[];
}
