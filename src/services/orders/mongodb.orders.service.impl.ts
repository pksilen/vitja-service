import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import OrdersService, { Order, OrderWithoutId } from './orders.service';
import dbManager from '../../dbManager';

const DB_NAME = 'vitja';
const COLLECTION_NAME = 'orders';

export default class MongoDbOrdersServiceImpl extends OrdersService {
  async getOrderById(idWrapper: IdWrapper): Promise<Order | ErrorResponse> {
    return await dbManager.getItemById(idWrapper._id, DB_NAME, COLLECTION_NAME);
  }

  async getOrderByBuyerId(idWrapper: IdWrapper): Promise<Order | ErrorResponse> {
    return await dbManager.getItemBy<Order>('buyerId', idWrapper._id, DB_NAME, COLLECTION_NAME);
  }

  async createOrder(orderWithoutId: OrderWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(orderWithoutId, DB_NAME, COLLECTION_NAME);
  }

  async deleteOrderById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(idWrapper._id, DB_NAME, COLLECTION_NAME);
  }
}
