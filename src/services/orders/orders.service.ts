import { ErrorResponse, getSourceFileName, IdWrapper } from '../../backk/Backk';
import { ShoppingCartItem } from '../users/users.service';
import { IsArray, IsIn, IsInstance, IsString } from 'class-validator';
import { Service } from '../../backk/service';

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

export default abstract class OrdersService implements Service{
  readonly fileName = getSourceFileName(__filename);

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
