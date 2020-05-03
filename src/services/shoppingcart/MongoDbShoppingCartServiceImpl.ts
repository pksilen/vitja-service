import ShoppingCartService from './ShoppingCartService';
import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import ShoppingCartWithoutId from './types/ShoppingCartWithoutId';
import UserIdWrapper from '../users/types/UserIdWrapper';
import ShoppingCart from './types/ShoppingCart';
import dbManager from '../../backk/dbmanager/MongoDbManager';

const DB_NAME = 'vitja';

export default class MongoDbShoppingCartServiceImpl extends ShoppingCartService {
  async deleteAllShoppingCarts(): Promise<void | ErrorResponse> {
    return await dbManager.deleteAllItems(DB_NAME, ShoppingCart);
  }

  async createShoppingCart(shoppingCartWithoutId: ShoppingCartWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(shoppingCartWithoutId, DB_NAME, ShoppingCart);
  }

  async getShoppingCartByUserId({ userId }: UserIdWrapper): Promise<ShoppingCart | ErrorResponse> {
    return await dbManager.getItemBy('userId', userId, DB_NAME, ShoppingCart);
  }

  async updateShoppingCart(shoppingCart: ShoppingCart): Promise<void | ErrorResponse> {
    await dbManager.updateItem(shoppingCart, DB_NAME, ShoppingCart);
  }

  async deleteShoppingCartById({ _id }: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(_id, DB_NAME, ShoppingCart);
  }
}
