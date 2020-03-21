import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import { ShoppingCartItem } from '../users/users.service';
import { IsArray, IsIn, IsInstance, IsString } from 'class-validator';

export class OrderWithoutId {
  @IsString()
  buyerId!: string;

  @IsInstance(ShoppingCartItem, { each: true })
  @IsArray()
  shoppingCartItems!: ShoppingCartItem[];

  /**  @IsIn(['toBeDelivered', 'delivering', 'delivered']) **/
  @IsIn(['toBeDelivered', 'delivering', 'delivered'])
  state!: string;
}

export class Order extends OrderWithoutId {
  @IsString()
  _id!: string;
}

export default abstract class OrdersService {
  readonly Types = {
    IdWrapper,
    OrderWithoutId,
    Order,
    ShoppingCartItem
  };

  abstract getOrderById(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  readonly GetOrderByIdReturnValueType = Order;

  abstract getOrderByBuyerId(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  readonly GetOrderByBuyerIdReturnValueType = Order;

  abstract createOrder(orderWithoutId: OrderWithoutId): Promise<IdWrapper | ErrorResponse>;
  readonly CreateOrderIdReturnValueType = IdWrapper;

  abstract deleteOrderById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
