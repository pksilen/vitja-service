import { OrderItemState } from '../enum/OrderItemState';
import _IdAndOrderItemId from './_IdAndOrderItemId';

export default class UpdateOrderItemStateArg extends _IdAndOrderItemId {
  public newState!: OrderItemState;
}
