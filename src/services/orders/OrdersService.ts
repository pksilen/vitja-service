import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrderCreateDto from './types/OrderCreateDto';
import Order from './types/Order';
import ShoppingCartItem from '../shoppingcart/types/ShoppingCartItem';
import OrderUpdateDto from './types/OrderUpdateDto';
import OrderIdAndState from './types/OrderIdAndState';
import UserIdAndOptPostQueryOps from '../users/types/UserIdAndOptPostQueryOps';

export default abstract class OrdersService {
  readonly Types = {
    UserIdAndOptPostQueryOps,
    OrderIdAndState,
    OrderCreateDto,
    OrderUpdateDto,
    Order,
    ShoppingCartItem
  };

  abstract deleteAllOrders(): Promise<void | ErrorResponse>;
  abstract createOrder(orderCreateDto: OrderCreateDto): Promise<IdWrapper | ErrorResponse>;
  abstract getOrdersByUserId(
    userIdAndOptPostQueryOps: UserIdAndOptPostQueryOps
  ): Promise<Order[] | ErrorResponse>;
  abstract getOrderById(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  abstract updateOrder(orderUpdateDto: OrderUpdateDto): Promise<void | ErrorResponse>;
  abstract updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse>;
  abstract deleteOrderById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
