import { ErrorResponse, IdWrapper } from '../../backk/Backk';
import UsersService from './UsersService';
import dbManager from '../../dbManager';
import UserNameWrapper from './types/UserNameWrapper';
import User from './types/User';
import UserWithoutId from './types/UserWithoutId';

const DB_NAME = 'vitja';
const COLLECTION_NAME = 'users';

export default class MongoDbUsersServiceImpl extends UsersService {
  async deleteAllUsers(): Promise<void | ErrorResponse> {
    return await dbManager.deleteAllItems(DB_NAME, COLLECTION_NAME);
  }

  async createUser(userWithoutId: UserWithoutId): Promise<IdWrapper | ErrorResponse> {
    return await dbManager.createItem(userWithoutId, DB_NAME, COLLECTION_NAME);
  }

  async getUserByUserName(userNameWrapper: UserNameWrapper): Promise<User | ErrorResponse> {
    return await dbManager.getItemBy('userName', userNameWrapper.userName, DB_NAME, COLLECTION_NAME);
  }

  async deleteUserById(idWrapper: IdWrapper): Promise<void | ErrorResponse> {
    await dbManager.deleteItemById(idWrapper._id, DB_NAME, COLLECTION_NAME);
  }

  async updateUser(user: User): Promise<void | ErrorResponse> {
    await dbManager.updateItem(user, DB_NAME, COLLECTION_NAME);
  }
}
