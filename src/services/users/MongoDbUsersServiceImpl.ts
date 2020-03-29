import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UsersService from './UsersService';
import dbManager from '../../dbManager';
import UserNameWrapper from './types/UserNameWrapper';
import User from './types/User';
import UserWithoutId from './types/UserWithoutId';
import PaymentMethodAndUserId from './types/PaymentMethodAndUserId';
import PaymentMethod from './types/PaymentMethod';
import { PaymentMethodIdAndUserId } from './types/PaymentMethodIdAndUserId';
import SalesItemIdAndUserId from './types/SalesItemIdAndUserId';

const DB_NAME = 'vitja';
const COLLECTION_NAME = 'users';

export default class MongoDbUsersServiceImpl extends UsersService {
  async getUserByUserName(userNameWrapper: UserNameWrapper): Promise<User | ErrorResponse> {
    return await dbManager.getItemBy('userName', userNameWrapper.userName, DB_NAME, COLLECTION_NAME);
  }

  async createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(userWithoutId, DB_NAME, COLLECTION_NAME);
  }

  async deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(idWrapper._id, DB_NAME, COLLECTION_NAME);
  }

  async updateUser(user: User): Promise<void | ErrorResponse> {
    await dbManager.updateItem(user, DB_NAME, COLLECTION_NAME);
  }

  async addPaymentMethodForUserById(
    paymentMethodAndUserId: PaymentMethodAndUserId
  ): Promise<void | ErrorResponse> {
    const { userId, ...paymentMethod } = paymentMethodAndUserId;

    return await dbManager.addSubItemForItemById<PaymentMethod, User>(
      paymentMethod,
      'paymentMethods',
      userId,
      DB_NAME,
      COLLECTION_NAME
    );
  }

  async removePaymentMethodByIdFromUserById(
    paymentMethodIdAndUserId: PaymentMethodIdAndUserId
  ): Promise<void | ErrorResponse> {
    await dbManager.removeSubItemByIdFromItemById(
      paymentMethodIdAndUserId.paymentMethodId,
      'paymentMethods',
      paymentMethodIdAndUserId.userId,
      DB_NAME,
      COLLECTION_NAME
    );
  }

  async addFavoriteSalesItemByIdToUserById(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse> {
    await dbManager.addSubItemIdForItemById<User>(
      salesItemIdAndUserId.salesItemId,
      'favoriteSalesItemIds',
      salesItemIdAndUserId.userId,
      DB_NAME,
      COLLECTION_NAME
    );
  }

  async removeFavoriteSalesItemByIdFromUserById(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse> {
    await dbManager.removeSubItemByIdFromItemById<User>(
      salesItemIdAndUserId.salesItemId,
      'favoriteSalesItemIds',
      salesItemIdAndUserId.userId,
      DB_NAME,
      COLLECTION_NAME
    );
  }

  async addSalesItemByIdToUserByIdShoppingCart(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse> {
    await dbManager.addSubItemIdForItemById<User>(
      salesItemIdAndUserId.salesItemId,
      'shoppingCartItems',
      salesItemIdAndUserId.userId,
      DB_NAME,
      COLLECTION_NAME
    );
  }

  async removeSalesItemByIdFromUserByIdShoppingCart(
    salesItemIdAndUserId: SalesItemIdAndUserId
  ): Promise<void | ErrorResponse> {
    await dbManager.removeSubItemByIdFromItemById<User>(
      salesItemIdAndUserId.salesItemId,
      'shoppingCartItems',
      salesItemIdAndUserId.userId,
      DB_NAME,
      COLLECTION_NAME
    );
  }
}
