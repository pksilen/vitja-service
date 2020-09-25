import CreateShoppingCartArg from '../args/CreateShoppingCartArg';
import Entity from "../../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class ShoppingCart extends CreateShoppingCartArg {
  @MaxLength(24)
  _id!: string;
}
