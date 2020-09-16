import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrderWithoutIdAndState from './types/OrderWithoutIdAndState';
import Order from './types/Order';
import ShoppingCartItem from '../shoppingcart/types/ShoppingCartItem';
import UserIdAndPaging from '../users/types/UserIdAndPaging';

export default abstract class OrdersService {
  readonly Types = {
    IdWrapper,
    OrderWithoutIdAndState,
    Order,
    ShoppingCartItem,
    UserIdAndPaging
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(orderWithoutIdAndState: OrderWithoutIdAndState): Promise<IdWrapper | ErrorResponse>;
  abstract getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse>;
  abstract getOrderByUserId({ userId }: UserIdAndPaging): Promise<Order | ErrorResponse>;
  abstract updateOrder(order: Order): Promise<void | ErrorResponse>;
  abstract deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse>;
}
