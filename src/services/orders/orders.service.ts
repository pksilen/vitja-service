import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import { ShoppingCartItem } from '../users/users.service';
import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';

export class OrderWithoutId {
  @IsString()
  buyerId!: string;

  @ValidateNested({ each: true })
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
    Order
  };

  abstract getOrderById(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  abstract getOrderByBuyerId(idWrapper: IdWrapper): Promise<Order | ErrorResponse>;
  abstract createOrder(orderWithoutId: OrderWithoutId): Promise<IdWrapper | ErrorResponse>;
  abstract deleteOrderById(idWrapper: IdWrapper): Promise<void | ErrorResponse>;
}
