import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrderWithoutIdAndCreatedTimestampAndState from './types/OrderWithoutIdAndCreatedTimestampAndState';
import Order from './types/Order';
import ShoppingCartItem from '../shoppingcart/types/ShoppingCartItem';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import OrderWithoutCreatedTimestampAndState from './types/OrderWithoutCreatedTimestampAndState';
import OrderIdAndState from './types/OrderIdAndState';

export default abstract class OrdersService {
  readonly Types = {
    IdWrapper,
    OrderIdAndState,
    OrderWithoutIdAndCreatedTimestampAndState,
    OrderWithoutCreatedTimestampAndState,
    Order,
    ShoppingCartItem,
    UserIdAndPaging
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(
    orderWithoutIdAndCreatedTimestampAndState: OrderWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse>;
  abstract getOrdersByUserId({ userId }: UserIdAndPaging): Promise<Order[] | ErrorResponse>;
  abstract getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse>;
  abstract updateOrder(
    orderWithoutCreatedTimestampAndState: OrderWithoutCreatedTimestampAndState
  ): Promise<void | ErrorResponse>;
  abstract updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse>;
  abstract deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse>;
}
