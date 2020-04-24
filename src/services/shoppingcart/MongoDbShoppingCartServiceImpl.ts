import ShoppingCartService from './ShoppingCartService';
import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import ShoppingCartWithoutId from './types/ShoppingCartWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import Order from '../orders/types/Order';
import ShoppingCart from './types/ShoppingCart';
import dbManager from '../../backk/dbmanager/mongoDbManager';

const DB_NAME = 'vitja';
const COLLECTION_NAME = 'shoppingcarts';

export default class MongoDbShoppingCartServiceImpl extends ShoppingCartService {
  async deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return await dbManager.deleteAllItems(DB_NAME, COLLECTION_NAME);
  }

  async createShoppingCart(shoppingCartWithoutId: ShoppingCartWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(shoppingCartWithoutId, DB_NAME, COLLECTION_NAME);
  }

  async getShoppingCartByUserId({ userId }: UserIdWrapper): Promise<ShoppingCart | ErrorResponse> {
    return await dbManager.getItemBy('userId', userId, DB_NAME, COLLECTION_NAME);
  }

  async updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    await dbManager.updateItem(shoppingCart, DB_NAME, COLLECTION_NAME);
  }

  async deleteShoppingCartById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(_id, DB_NAME, COLLECTION_NAME);
  }
}
