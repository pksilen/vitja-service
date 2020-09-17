import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrderWithoutIdAndState from './types/OrderWithoutIdAndState';
import Order from './types/Order';
import ShoppingCartItem from '../shoppingcart/types/ShoppingCartItem';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import OrderWithoutState from "./types/OrderWithoutState";
import OrderIdAndState from "./types/OrderIdAndState";

export default abstract class OrdersService {
  readonly Types = {
    IdWrapper,
    OrderIdAndState,
    OrderWithoutIdAndState,
    Order,
    ShoppingCartItem,
    UserIdAndPaging
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(orderWithoutIdAndState: OrderWithoutIdAndState): Promise<IdWrapper | ErrorResponse>;
  abstract getOrdersByUserId({ userId }: UserIdAndPaging): Promise<Order[] | ErrorResponse>;
  abstract getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse>;
  abstract updateOrder(order: OrderWithoutState): Promise<void | ErrorResponse>;
  abstract updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse>
  abstract deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse>;
}
