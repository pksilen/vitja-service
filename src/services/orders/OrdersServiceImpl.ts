import { Injectable } from '@nestjs/common';
import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrdersService from './OrdersService';
import Order from './types/Order';
import OrderWithoutIdAndState from './types/OrderWithoutIdAndState';
import UserIdAndPaging from '../users/types/UserIdAndPaging';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';
import OrderWithoutState from "./types/OrderWithoutState";
import OrderIdAndState from "./types/OrderIdAndState";

@Injectable()
export default class OrdersServiceImpl extends OrdersService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  deleteAllOrders(): Promise<void | ErrorResponse> {
    return this.dbManager.deleteAllItems(Order);
  }

  createOrder(orderWithoutIdAndState: OrderWithoutIdAndState): Promise<IdWrapper | ErrorResponse> {
    return this.dbManager.createItem(
      { ...orderWithoutIdAndState, state: 'toBeDelivered' },
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

  updateOrder(order: OrderWithoutState): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(order, Order, this.Types);
  }

  updateOrderState(orderIdAndState: OrderIdAndState): Promise<void | ErrorResponse> {
    return this.dbManager.updateItem(orderIdAndState, Order, this.Types);
  }

  deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    return this.dbManager.deleteItemById(_id, Order);
  }
}
