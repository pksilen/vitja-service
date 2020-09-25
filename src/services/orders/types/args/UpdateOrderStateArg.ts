import { Id } from "../../../../backk/Backk";

export default class UpdateOrderStateArg extends Id {
  state!: 'toBeDelivered' | 'delivering' | 'delivered';
}
