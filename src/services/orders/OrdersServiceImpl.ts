import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrdersService from './OrdersService';
import Order from './types/Order';
import OrderWithoutIdAndCreatedTimestampAndState from './types/OrderWithoutIdAndCreatedTimestampAndState';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import OrderWithoutCreatedTimestampAndState from './types/OrderWithoutCreatedTimestampAndState';
import OrderIdAndState from './types/OrderIdAndState';

@Injectable()
export default class OrdersServiceImpl extends OrdersService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(Order);
  }

  createOrder(
    orderWithoutIdAndCreatedTimestampAndState: OrderWithoutIdAndCreatedTimestampAndState
  ): Promise<IdWrapper | ErrorResponse> {
    return this.dbManager.createItem(
      {
        ...orderWithoutIdAndCreatedTimestampAndState,
        createdTimestampInSecs: Math.round(Date.now() / 1000),
        state: 'toBeDelivered'
      },
      Order,
      this.Types
    );
  }

  getOrdersByUserId({ userId }: UserIdAndPaging): Promise<Order[] | ErrorResponse> {
    return this.dbManager.getItemsBy<Order>('userId', userId, Order, this.Types);
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
