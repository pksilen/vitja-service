import { ErrorResponse, Id, IdAndUserId } from "../../backk/Backk";
import CreateOrderArg from './types/args/CreateOrderArg';
import Order from './types/entity/Order';
import ShoppingCartItem from '../shoppingcart/types/entities/ShoppingCartItem';
import UpdateOrderArg from './types/args/UpdateOrderArg';
import UpdateOrderStateArg from './types/args/UpdateOrderStateArg';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import BaseService from '../../backk/BaseService';

export default abstract class OrdersService extends BaseService {
  readonly Types = {
    GetByUserIdArg,
    UpdateOrderStateArg,
    CreateOrderArg,
    UpdateOrderArg,
    Order,
    ShoppingCartItem
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(arg: CreateOrderArg): Promise<Id | ErrorResponse>;
  abstract getOrdersByUserId(arg: GetByUserIdArg): Promise<Order[] | ErrorResponse>;
  abstract getOrderById(idAndUserId: IdAndUserId): Promise<Order | ErrorResponse>;
  abstract updateOrder(arg: UpdateOrderArg): Promise<void | ErrorResponse>;
  abstract updateOrderState(arg: UpdateOrderStateArg): Promise<void | ErrorResponse>;
  abstract deleteOrderById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
