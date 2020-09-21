import ShoppingCartCreateDto from './ShoppingCartCreateDto';
import Entity from "../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class ShoppingCart extends ShoppingCartCreateDto {
  @MaxLength(24)
  _id!: string;
}
