import ShoppingCartWithoutId from './ShoppingCartWithoutId';
import Entity from "../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class ShoppingCart extends ShoppingCartWithoutId {
  @MaxLength(24)
  _id!: string;
}
