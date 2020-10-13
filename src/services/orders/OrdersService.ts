import { ErrorResponse, IdAndUserId } from '../../backk/Backk';
import BaseService from '../../backk/BaseService';
import ShoppingCartItem from '../shoppingcart/types/entities/ShoppingCartItem';
import GetByUserIdArg from '../users/types/args/GetByUserIdArg';
import CreateOrderArg from './types/args/CreateOrderArg';
import CreateOrderItemArg from './types/args/CreateOrderItemArg';
import DeliverOrderItemArg from './types/args/DeliverOrderItemArg';
import OrderIdAndOrderItemIdAndUserId from './types/args/OrderIdAndOrderItemIdAndUserId';
import UpdateOrderItemDeliveryStateArg from './types/args/UpdateOrderItemDeliveryStateArg';
import Order from './types/entity/Order';
import OrderItem from './types/entity/OrderItem';

export default abstract class OrdersService extends BaseService {
  readonly Types = {
    CreateOrderArg,
    CreateOrderItemArg,
    DeliverOrderItemArg,
    GetByUserIdArg,
    Order,
    OrderItem,
    OrderIdAndOrderItemIdAndUserId,
    ShoppingCartItem,
    UpdateOrderItemDeliveryStateArg
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(arg: CreateOrderArg): Promise<Order | ErrorResponse>;
  abstract getOrdersByUserId(arg: GetByUserIdArg): Promise<Order[] | ErrorResponse>;
  abstract getOrderById(arg: IdAndUserId): Promise<Order | ErrorResponse>;
  abstract deliverOrderItem(arg: DeliverOrderItemArg): Promise<void | ErrorResponse>;
  abstract updateOrderItemDeliveryState(arg: UpdateOrderItemDeliveryStateArg): Promise<void | ErrorResponse>;
  abstract deleteOrderItem(arg: OrderIdAndOrderItemIdAndUserId): Promise<void | ErrorResponse>;
  abstract deleteOrderById(arg: IdAndUserId): Promise<void | ErrorResponse>;
}
