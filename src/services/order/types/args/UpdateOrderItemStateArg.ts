import { ArrayMaxSize, ArrayMinSize } from "class-validator";
import _IdAndVersion from "../../../../backk/types/id/_IdAndVersion";
import OrderItemForStateUpdate from "./OrderItemForStateUpdate";

export default class UpdateOrderItemStateArg extends _IdAndVersion {
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  orderItems!: OrderItemForStateUpdate[];
}
