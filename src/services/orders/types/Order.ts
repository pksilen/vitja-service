import OrderWithoutIdAndState from './OrderWithoutIdAndState';
import Entity from "../../../backk/Entity";
import { MaxLength } from "class-validator";

@Entity
export default class Order extends OrderWithoutIdAndState {
  @MaxLength(24)
  _id!: string;

  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
