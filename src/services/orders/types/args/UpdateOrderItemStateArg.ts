import { OrderState } from '../enum/OrderState';
import OrderIdAndOrderItemId from "./OrderIdAndOrderItemId";

export default class UpdateOrderItemStateArg extends OrderIdAndOrderItemId{
  public newState!: OrderState;
}
