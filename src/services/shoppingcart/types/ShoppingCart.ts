import ShoppingCartWithoutId from './ShoppingCartWithoutId';
import Entity from "../../../backk/Entity";

@Entity
export default class ShoppingCart extends ShoppingCartWithoutId {
  _id!: string;
}
