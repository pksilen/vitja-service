import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrdersService from './OrdersService';
import Order from './types/Order';
import OrderCreateDto from './types/OrderCreateDto';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import OrderUpdateDto from './types/OrderUpdateDto';
import OrderIdAndState from './types/OrderIdAndState';
import SalesItemsService from '../salesitems/SalesItemsService';
import UserIdAndOptPostQueryOps from '../users/types/UserIdAndOptPostQueryOps';

@Injectable()
export default class OrdersServiceImpl extends OrdersService {
  constructor(
    private readonly dbManager: AbstractDbManager,
    private readonly salesItemsService: SalesItemsService
  ) {
    super();
  }

  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(Order);
  }

  async createOrder(orderCreateDto: OrderCreateDto): Promise<IdWrapper | ErrorResponse> {
    const errorResponse = await orderCreateDto.shoppingCartItems.reduce(
      async (errorResponseAccumulator: Promise<void | ErrorResponse>, shoppingCartItem) => {
        return (
          (await errorResponseAccumulator) ||
          (await this.salesItemsService.updateSalesItemState(
            {
              _id: shoppingCartItem.salesItemId,
              state: 'sold'
            },
            'forSale'
          ))
        );
      },
      Promise.resolve(undefined)
    );

    return errorResponse
      ? errorResponse
      : await this.dbManager.createItem(
          {
            ...orderCreateDto,
            createdTimestampInSecs: Math.round(Date.now() / 1000),
            state: 'toBeDelivered'
          },
          Order,
          this.Types
        );
  }

  getOrdersByUserId({ userId, ...postQueryOps }: UserIdAndOptPostQueryOps): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy('userId', userId, Order, this.Types, postQueryOps);
  }

  getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse> {
    return this.dbManager.getItemById(_id, Order, this.Types);
  }

  updateOrder(orderUpdateDto: OrderUpdateDto): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(orderUpdateDto, Order, this.Types);
  }

  updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(orderIdAndState, Order, this.Types);
  }

  deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, Order);
  }
}
