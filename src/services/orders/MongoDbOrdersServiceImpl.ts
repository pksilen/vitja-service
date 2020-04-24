import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrdersService from './OrdersService';
import dbManager from '../../backk/dbmanager/mongoDbManager';
import Order from './types/Order';
import OrderWithoutId from './types/OrderWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';

const DB_NAME = 'vitja';
const COLLECTION_NAME = 'orders';

export default class MongoDbOrdersServiceImpl extends OrdersService {
  async deleteAllOrders(): Promise<void | ErrorResponse> {
    return await dbManager.deleteAllItems(DB_NAME, COLLECTION_NAME);
  }

  async createOrder(orderWithoutId: OrderWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(orderWithoutId, DB_NAME, COLLECTION_NAME);
  }

  async getOrderById({ _id }: IdWrapper): Promise<Order | ErrorResponse> {
    return await dbManager.getItemById(_id, DB_NAME, COLLECTION_NAME);
  }

  async getOrderByUserId({ userId }: UserIdWrapper): Promise<Order | ErrorResponse> {
    return await dbManager.getItemBy<Order>('userId', userId, DB_NAME, COLLECTION_NAME);
  }

  async updateOrder(order: Order): Promise<void | ErrorResponse> {
    return await dbManager.updateItem(order, DB_NAME, COLLECTION_NAME);
  }

  async deleteOrderById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(_id, DB_NAME, COLLECTION_NAME);
  }
}
