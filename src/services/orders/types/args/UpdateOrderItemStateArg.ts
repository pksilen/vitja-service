import { OrderState } from '../enum/OrderState';
import _IdAndOrderItemId from './_IdAndOrderItemId';

export default class UpdateOrderItemStateArg extends _IdAndOrderItemId {
  public newState!: OrderState;
}
