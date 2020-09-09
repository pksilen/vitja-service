import OrderWithoutId from './OrderWithoutId';
import Entity from "../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class Order extends OrderWithoutId {
  @MaxLength(24)
  _id!: string;
}
