import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UsersService, {
  PaymentMethod,
  PaymentMethodAndUserId,
  PaymentMethodIdAndUserId,
  SalesItemIdAndUserId,
  User,
  UserNameWrapper,
  UserWithoutId
} from './users.service';
import dbManager from '../../dbManager';

const DB_NAME = 'vitja';
const COLLECTION_NAME = 'users';

export default class MongodbUsersServiceImpl extends UsersService {
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
