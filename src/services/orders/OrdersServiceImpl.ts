import { Injectable } from "@nestjs/common";
import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrdersService from './OrdersService';
import Order from './types/Order';
import OrderWithoutId from './types/OrderWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import AbstractDbManager from 'src/backk/dbmanager/AbstractDbManager';

@Injectable()
export default class OrdersServiceImpl extends OrdersService {
  constructor(private readonly dbManager: AbstractDbManager) {
    super();
  }

  async deleteAllOrders(): Promise<void | ErrorResponse> {
    return await this.dbManager.deleteAllItems(Order);
  }

  async createOrder(orderWithoutId: OrderWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await this.dbManager.createItem(orderWithoutId, Order, this.Types);
  }

  async getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse> {
    return await this.dbManager.getItemById(_id, Order, this.Types);
  }

  async getOrderByUserId({ userId }: UserIdWrapper): Promise<Order | ErrorResponse> {
    return await this.dbManager.getItemBy<Order>('userId', userId, Order, this.Types);
  }

  async updateOrder(order: Order): Promise<void | ErrorResponse> {
    return await this.dbManager.updateItem(order, Order, this.Types);
  }

  async deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await this.dbManager.deleteItemById(_id, Order);
  }
}
