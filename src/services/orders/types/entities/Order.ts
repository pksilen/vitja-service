import { ArrayMaxSize } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "./OrderItem";
import _IdAndCreatedAtTimestamp from "../../../../backk/types/id/_IdAndCreatedAtTimestamp";

@Entity()
export default class Order extends _IdAndCreatedAtTimestamp {
  public userId!: string;

  @ArrayMaxSize(50)
  public orderItems!: OrderItem[];
}
