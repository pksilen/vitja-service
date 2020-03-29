import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrderWithoutId from './types/OrderWithoutId';
import Order from './types/Order';
import ShoppingCartItem from '../users/types/ShoppingCartItem';

export default abstract class OrdersService {
  readonly Types = {
    IdWrapper,
    OrderWithoutId,
    Order,
    ShoppingCartItem
  };

  abstract getOrderById(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  abstract getOrderByBuyerId(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  abstract createOrder(orderWithoutId: OrderWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract deleteOrderById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
