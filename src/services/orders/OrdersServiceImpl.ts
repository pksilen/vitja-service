import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdWrapper } from "../../backk/Backk";
import OrdersService from './OrdersService';
import Order from './types/Order';
import OrderWithoutIdAndCreatedTimestampAndState from './types/OrderWithoutIdAndCreatedTimestampAndState';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import OrderWithoutCreatedTimestampAndState from './types/OrderWithoutCreatedTimestampAndState';
import OrderIdAndState from './types/OrderIdAndState';
import SalesItemsService from '../salesitems/SalesItemsService';
import UserIdAndOptionalPostQueryOperations from "../users/types/UserIdAndOptionalPostQueryOperations";

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

  async createOrder(
    orderWithoutIdAndCreatedTimestampAndState: OrderWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse> {
    const errorResponse = await orderWithoutIdAndCreatedTimestampAndState.shoppingCartItems.reduce(
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
            ...orderWithoutIdAndCreatedTimestampAndState,
            createdTimestampInSecs: Math.round(Date.now() / 1000),
            state: 'toBeDelivered'
          },
          Order,
          this.Types
        );
  }

  getOrdersByUserId({
    userId,
    ...postQueryOperations
  }: UserIdAndOptionalPostQueryOperations): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy('userId', userId, Order, this.Types, postQueryOperations);
  }

  getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse> {
    return this.dbManager.getItemById(_id, Order, this.Types);
  }

  updateOrder(
    orderWithoutCreatedTimestampAndState: OrderWithoutCreatedTimestampAndState
  ): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(orderWithoutCreatedTimestampAndState, Order, this.Types);
  }

  updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(orderIdAndState, Order, this.Types);
  }

  deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, Order);
  }
}
