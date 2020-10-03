import { ErrorResponse, Id, IdAndUserId } from '../../backk/Backk';
import BaseService from '../../backk/BaseService';
import ShoppingCartItem from '../shoppingcart/types/common/ShoppingCartItem';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import CreateOrderArg from './types/args/CreateOrderArg';
import DeliverOrderArg from './types/args/DeliverOrderArg';
import UpdateOrderArg from './types/args/UpdateOrderArg';
import UpdateOrderDeliveryStateArg from './types/args/UpdateOrderDeliveryStateArg';
import Order from './types/entity/Order';

export default abstract class OrdersService extends BaseService {
  readonly Types = {
    GetByUserIdArg,
    DeliverOrderArg,
    UpdateOrderDeliveryStateArg,
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
  abstract deliverOrder(arg: DeliverOrderArg): Promise<void | ErrorResponse>;
  abstract updateOrderDeliveryState(arg: UpdateOrderDeliveryStateArg): Promise<void | ErrorResponse>;
  abstract deleteOrderById(idAndUserId: IdAndUserId): Promise<void | ErrorResponse>;
}
