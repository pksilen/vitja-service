import { ArrayMaxSize } from "class-validator";
import Entity from "../../../../backk/decorators/entity/Entity";
import OrderItem from "./OrderItem";
import _IdAndCreatedAtTimestamp from "../../../../backk/types/id/_IdAndCreatedAtTimestamp";
import { Unique } from "../../../../backk/decorators/typeproperty/Unique";

@Entity()
export default class Order extends _IdAndCreatedAtTimestamp {
  @Unique()
  userId!: string;

  @ArrayMaxSize(50)
  orderItems!: OrderItem[];
}
