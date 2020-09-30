import { Id } from "../../../../backk/Backk";

export default class UpdateOrderDeliveryStateArg extends Id {
  state!: 'toBeDelivered' | 'delivering' | 'delivered' | 'returning' | 'returned';
}
